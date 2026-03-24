const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

export interface BookSearchResult {
  googleBooksId: string;
  title: string;
  author: string;
  totalPages: number;
  coverUrl: string | null;
  description: string | null;
  isbn: string | null;
}

export async function searchBooks(query: string): Promise<BookSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const params = new URLSearchParams({
    q: query,
    maxResults: '8',
    langRestrict: 'iw',
    orderBy: 'relevance',
  });

  try {
    const res = await fetch(`${GOOGLE_BOOKS_API}?${params}`);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.items) return [];

    return data.items.map((item: any): BookSearchResult => {
      const info = item.volumeInfo;

      // Get best available cover
      const covers = info.imageLinks;
      const coverUrl = covers?.thumbnail
        ?.replace('http://', 'https://')
        ?.replace('&edge=curl', '') ?? null;

      // Get ISBN for Open Library fallback
      const isbn = info.industryIdentifiers?.find(
        (id: any) => id.type === 'ISBN_13'
      )?.identifier ?? null;

      return {
        googleBooksId: item.id,
        title: info.title ?? 'ללא כותרת',
        author: info.authors?.[0] ?? 'מחבר לא ידוע',
        totalPages: info.pageCount ?? 0,
        coverUrl: coverUrl ?? getFallbackCover(isbn),
        description: info.description ?? null,
        isbn,
      };
    });
  } catch {
    return [];
  }
}

// Open Library fallback if Google has no cover
function getFallbackCover(isbn: string | null): string | null {
  if (!isbn) return null;
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}
