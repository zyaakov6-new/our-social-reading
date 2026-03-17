const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const OPEN_LIBRARY_API = 'https://openlibrary.org/search.json';

export interface BookSearchResult {
  googleBooksId: string;
  title: string;
  author: string;
  totalPages: number;
  /** Primary URL to store in DB. */
  coverUrl: string | null;
  /** Ordered list of cover URLs to try; CoverImg tries each until one loads. */
  coverUrls: string[];
  description: string | null;
  isbn: string | null;
}

const hasHebrew = (s: string) => /[\u0590-\u05FF]/.test(s);

/**
 * Cover URL order:
 * 1. Google Books thumbnail (direct from API — most reliable when present)
 * 2. Google content URL (works for ~80% of books even without imageLinks)
 * 3. Open Library by ISBN with ?default=false (404 on miss → onError fires)
 */
function buildGoogleCoverUrls(item: any, isbn: string | null): string[] {
  const urls: string[] = [];

  const covers = item.volumeInfo?.imageLinks;
  if (covers) {
    const img =
      covers.thumbnail ||
      covers.smallThumbnail ||
      covers.medium ||
      covers.large ||
      covers.extraLarge;
    if (img) urls.push(img.replace('http://', 'https://').replace('&edge=curl', ''));
  }

  // Google content URL — reliable cover for most books even without imageLinks
  urls.push(
    `https://books.google.com/books/content?id=${item.id}&printsec=frontcover&img=1&zoom=1&source=gbs_api`
  );

  // Open Library by ISBN — MUST use ?default=false so missing covers return 404 (not a 1×1 pixel)
  if (isbn) {
    urls.push(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`);
  }

  return urls;
}

function mapGoogleItem(item: any): BookSearchResult {
  const info = item.volumeInfo;
  const isbn =
    info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier ??
    info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier ??
    null;
  const coverUrls = buildGoogleCoverUrls(item, isbn);
  return {
    googleBooksId: item.id,
    title: info.title ?? 'ללא כותרת',
    author: info.authors?.[0] ?? 'מחבר לא ידוע',
    totalPages: info.pageCount ?? 0,
    coverUrl: coverUrls[0] ?? null,
    coverUrls,
    description: info.description ?? null,
    isbn,
  };
}

async function searchGoogleBooks(query: string, langRestrict?: string): Promise<BookSearchResult[]> {
  const params = new URLSearchParams({ q: query, maxResults: '20', orderBy: 'relevance' });
  if (langRestrict) params.set('langRestrict', langRestrict);
  const res = await fetch(`${GOOGLE_BOOKS_API}?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.items?.length) return [];

  return data.items
    .filter((item: any) => item.volumeInfo?.printType !== 'MAGAZINE')
    .slice(0, 10)
    .map(mapGoogleItem);
}

async function searchOpenLibrary(query: string): Promise<BookSearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: '10',
    fields: 'key,title,author_name,number_of_pages_median,isbn,cover_i',
  });
  const res = await fetch(`${OPEN_LIBRARY_API}?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.docs?.length) return [];

  return data.docs.slice(0, 10).map((doc: any): BookSearchResult => {
    const isbn = doc.isbn?.[0] ?? null;
    const coverUrls: string[] = [];
    // cover_i is the Open Library internal cover ID — very reliable when present
    if (doc.cover_i) {
      coverUrls.push(`https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg?default=false`);
    }
    if (isbn) {
      coverUrls.push(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`);
    }
    return {
      googleBooksId: doc.key ?? String(Math.random()),
      title: doc.title ?? 'ללא כותרת',
      author: doc.author_name?.[0] ?? 'מחבר לא ידוע',
      totalPages: doc.number_of_pages_median ?? 0,
      coverUrl: coverUrls[0] ?? null,
      coverUrls,
      description: null,
      isbn,
    };
  });
}

export async function searchBooks(query: string): Promise<BookSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const isHebrew = hasHebrew(query);

  try {
    if (isHebrew) {
      // For Hebrew: run both searches in parallel — langRestrict=iw gets Hebrew-language books,
      // general search catches books with Hebrew titles in other-language catalogs.
      // Merge Hebrew-language results first.
      const [hebrew, general] = await Promise.all([
        searchGoogleBooks(query, 'iw'),
        searchGoogleBooks(query),
      ]);
      const seen = new Set<string>();
      const merged: BookSearchResult[] = [];
      for (const b of [...hebrew, ...general]) {
        if (!seen.has(b.googleBooksId)) {
          seen.add(b.googleBooksId);
          merged.push(b);
        }
      }
      if (merged.length > 0) return merged.slice(0, 12);
    } else {
      const results = await searchGoogleBooks(query);
      if (results.length > 0) return results;
    }
  } catch { /* fall through */ }

  // Fallback to Open Library (also supports Hebrew books)
  try {
    return await searchOpenLibrary(query);
  } catch {
    return [];
  }
}
