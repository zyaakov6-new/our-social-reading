import { useState, useEffect, useRef } from 'react';
import { searchBooks, BookSearchResult } from '../services/googleBooks';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  onBookAdded: () => void; // callback to refresh your books list
}

export default function BookSearch({ onBookAdded }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // Debounce - wait 400ms after user stops typing
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const books = await searchBooks(query);
        setResults(books);
      } catch (e) {
        setError('שגיאה בחיפוש. נסה שוב.');
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function handleSelectBook(book: BookSearchResult) {
    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('לא מחובר');

      const { error: insertError } = await supabase
        .from('books')
        .insert({
          user_id: user.id,
          title: book.title,
          author: book.author,
          total_pages: book.totalPages,
          cover_url: book.coverUrl,
          status: 'reading',
          current_page: 0,
        });

      if (insertError) throw insertError;

      // Reset and notify parent
      setQuery('');
      setResults([]);
      onBookAdded();

    } catch (e: any) {
      setError(e.message ?? 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="חפש ספר לפי שם או מחבר..."
        dir="rtl"
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1.5px solid #e0ddd6',
          fontSize: '15px',
          fontFamily: 'inherit',
          background: '#fff',
          boxSizing: 'border-box',
        }}
      />

      {loading && (
        <div style={{ textAlign: 'center', padding: '12px', color: '#888' }}>
          מחפש...
        </div>
      )}

      {error && (
        <div style={{ color: '#c0392b', padding: '8px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          left: 0,
          background: '#fff',
          border: '1px solid #e0ddd6',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          zIndex: 100,
          maxHeight: '360px',
          overflowY: 'auto',
        }}>
          {results.map(book => (
            <div
              key={book.googleBooksId}
              onClick={() => !saving && handleSelectBook(book)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                cursor: saving ? 'wait' : 'pointer',
                borderBottom: '1px solid #f0ede8',
                direction: 'rtl',
              }}
            >
              {/* Cover */}
              <div style={{
                width: '40px',
                height: '56px',
                borderRadius: '4px',
                overflow: 'hidden',
                flexShrink: 0,
                background: '#e8e4dc',
              }}>
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => {
                      // Hide broken image, show placeholder
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px',
                  }}>📖</div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: '600', fontSize: '14px',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {book.title}
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                  {book.author}
                  {book.totalPages > 0 && ` · ${book.totalPages} עמודים`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}