import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  status: 'reading' | 'finished' | 'want' | 'abandoned';
  coverUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Module-level stale-while-revalidate cache
interface BooksCache { books: Book[]; userId: string; time: number; }
let _booksCache: BooksCache | null = null;
const BOOKS_TTL = 2 * 60 * 1000; // 2 minutes

export const useBooks = () => {
  const { user } = useAuth();

  const isCacheValid = !!(
    _booksCache &&
    _booksCache.userId === user?.id &&
    Date.now() - _booksCache.time < BOOKS_TTL
  );

  const [books, setBooks] = useState<Book[]>(
    _booksCache?.userId === user?.id ? (_booksCache?.books ?? []) : []
  );
  const [loading, setLoading] = useState(!isCacheValid);

  const fetchBooks = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const mappedBooks: Book[] = (data || []).map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        totalPages: book.total_pages,
        currentPage: book.current_page,
        status: book.status as 'reading' | 'finished' | 'want',
        coverUrl: book.cover_url || undefined,
        createdAt: book.created_at,
        updatedAt: book.updated_at,
      }));

      _booksCache = { books: mappedBooks, userId: user.id, time: Date.now() };
      setBooks(mappedBooks);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (bookId: string, status: 'reading' | 'finished' | 'want' | 'abandoned') => {
    try {
      const { error } = await supabase
        .from("books")
        .update({ status })
        .eq("id", bookId);
      if (error) throw error;
      setBooks(prev => prev.map(b => b.id === bookId ? { ...b, status } : b));
      if (_booksCache && _booksCache.userId === user?.id) {
        _booksCache = {
          ..._booksCache,
          books: _booksCache.books.map(b => b.id === bookId ? { ...b, status } : b),
          time: Date.now(),
        };
      }
      return true;
    } catch (error) {
      console.error("Error updating book status:", error);
      return false;
    }
  };

  const deleteBook = async (bookId: string) => {
    try {
      const { error } = await supabase
        .from("books")
        .delete()
        .eq("id", bookId);

      if (error) throw error;

      setBooks((prev) => prev.filter((book) => book.id !== bookId));
      if (_booksCache && _booksCache.userId === user?.id) {
        _booksCache = {
          ..._booksCache,
          books: _booksCache.books.filter(b => b.id !== bookId),
          time: Date.now(),
        };
      }
      return true;
    } catch (error) {
      console.error("Error deleting book:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  return { books, loading, refetch: fetchBooks, deleteBook, updateStatus };
};
