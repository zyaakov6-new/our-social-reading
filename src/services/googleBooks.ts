const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const OPEN_LIBRARY_API = 'https://openlibrary.org/search.json';

export interface BookSearchResult {
  googleBooksId: string;
  title: string;
  author: string;
  totalPages: number;
  /** Primary URL to store in DB (first in coverUrls). */
  coverUrl: string | null;
  /** Ordered list of cover URLs to try; CoverImg tries each until one loads. */
  coverUrls: string[];
  description: string | null;
  isbn: string | null;
}

/**
 * Builds an ordered list of cover URL candidates for a Google Books item.
 * - imageLinks.thumbnail → most commonly available, highest quality
 * - Google content URL   → works for ~80% of books even with no imageLinks
 * - Open Library by ISBN → additional source; ?default=false returns 404 (not 1×1) on miss
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

  // Google content URL — often returns a real cover even when imageLinks is absent
  urls.push(
    `https://books.google.com/books/content?id=${item.id}&printsec=frontcover&img=1&zoom=1&source=gbs_api`
  );

  if (isbn) {
    urls.push(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`);
  }

  return urls;
}

async function searchGoogleBooks(query: string): Promise<BookSearchResult[]> {
  const params = new URLSearchParams({ q: query, maxResults: '12', orderBy: 'relevance' });
  const res = await fetch(`${GOOGLE_BOOKS_API}?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.items?.length) return [];

  return data.items
    .filter((item: any) => item.volumeInfo?.printType !== 'MAGAZINE')
    .slice(0, 8)
    .map((item: any): BookSearchResult => {
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
    });
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

  return data.docs.slice(0, 8).map((doc: any): BookSearchResult => {
    const isbn = doc.isbn?.[0] ?? null;
    const coverUrls: string[] = [];
    if (doc.cover_i) coverUrls.push(`https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg?default=false`);
    if (isbn) coverUrls.push(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`);
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
  try {
    const googleResults = await searchGoogleBooks(query);
    if (googleResults.length > 0) return googleResults;
  } catch { /* fall through */ }
  try {
    return await searchOpenLibrary(query);
  } catch {
    return [];
  }
}
