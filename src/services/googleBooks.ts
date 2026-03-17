const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const OPEN_LIBRARY_API = 'https://openlibrary.org/search.json';

export interface BookSearchResult {
  googleBooksId: string;
  title: string;
  author: string;
  totalPages: number;
  coverUrl: string | null;
  description: string | null;
  isbn: string | null;
}

async function searchGoogleBooks(query: string): Promise<BookSearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    maxResults: '12',
    orderBy: 'relevance',
  });

  const res = await fetch(`${GOOGLE_BOOKS_API}?${params}`);
  if (!res.ok) return [];

  const data = await res.json();
  if (!data.items?.length) return [];

  return data.items
    .filter((item: any) => item.volumeInfo?.printType !== 'MAGAZINE')
    .slice(0, 8)
    .map((item: any): BookSearchResult => {
      const info = item.volumeInfo;
      const covers = info.imageLinks;
      const coverUrl =
        covers?.thumbnail
          ?.replace('http://', 'https://')
          ?.replace('&edge=curl', '') ?? null;
      const isbn =
        info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')
          ?.identifier ?? null;
      return {
        googleBooksId: item.id,
        title: info.title ?? 'ללא כותרת',
        author: info.authors?.[0] ?? 'מחבר לא ידוע',
        totalPages: info.pageCount ?? 0,
        coverUrl: coverUrl ?? (isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : null),
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
    const coverId = doc.cover_i;
    const coverUrl = coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
      : isbn
      ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
      : null;
    return {
      googleBooksId: doc.key ?? String(Math.random()),
      title: doc.title ?? 'ללא כותרת',
      author: doc.author_name?.[0] ?? 'מחבר לא ידוע',
      totalPages: doc.number_of_pages_median ?? 0,
      coverUrl,
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
  } catch {
    // Google Books failed, fall through to Open Library
  }

  try {
    return await searchOpenLibrary(query);
  } catch {
    return [];
  }
}
