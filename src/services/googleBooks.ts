const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

export interface BookSearchResult {
  googleBooksId: string;
  title: string;
  author: string;
  totalPages: number;
  coverUrl: string | null;
  coverUrls: string[];
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

      const covers = info.imageLinks;
      const thumbnail = covers?.thumbnail
        ?.replace('http://', 'https://')
        ?.replace('&edge=curl', '') ?? null;

      const isbn =
        info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier ??
        info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier ??
        null;

      const olCover = isbn
        ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`
        : null;

      const coverUrls: string[] = [
        thumbnail,
        `https://books.google.com/books/content?id=${item.id}&printsec=frontcover&img=1&zoom=1&source=gbs_api`,
        olCover,
      ].filter(Boolean) as string[];

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
  } catch {
    return [];
  }
}
