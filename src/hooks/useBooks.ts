import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  status: 'reading' | 'finished' | 'want';
  coverUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const useBooks = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

      setBooks(mappedBooks);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
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
      return true;
    } catch (error) {
      console.error("Error deleting book:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  return { books, loading, refetch: fetchBooks, deleteBook };
};
