import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { mockChallenges } from "@/lib/mockData";
import { useBooks } from "@/hooks/useBooks";
import { useReadingSessions } from "@/hooks/useReadingSessions";
import FeedItemCard from "@/components/FeedItemCard";
import ChallengeCard from "@/components/ChallengeCard";
import BookCard from "@/components/BookCard";
import AddBookDialog from "@/components/AddBookDialog";
import { BookOpen, Users, Trophy } from "lucide-react";

type Tab = 'feed' | 'challenges' | 'books';

const pathToTab: Record<string, Tab> = {
  '/': 'feed',
  '/challenges': 'challenges',
  '/books': 'books',
};

const Home = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>(pathToTab[location.pathname] || 'feed');
  const { books, refetch: refetchBooks, deleteBook } = useBooks();
  const { sessions, refetch: refetchSessions } = useReadingSessions();

  const handleLogSaved = () => {
    refetchBooks();
    refetchSessions();
  };

  useEffect(() => {
    const tab = pathToTab[location.pathname];
    if (tab) setActiveTab(tab);
  }, [location.pathname]);

  const tabs: { key: Tab; label: string; icon: React.ElementType; path: string }[] = [
    { key: 'feed', label: 'הפיד שלי', icon: Users, path: '/' },
    { key: 'challenges', label: 'אתגרים', icon: Trophy, path: '/challenges' },
    { key: 'books', label: 'הספרים שלי', icon: BookOpen, path: '/books' },
  ];

  const readingBooks = books.filter(b => b.status === 'reading');
  const finishedBooks = books.filter(b => b.status === 'finished');
  const wantBooks = books.filter(b => b.status === 'want');

  return (
    <div className="min-h-screen pb-28">
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border/50 px-4 pt-6 pb-3">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="font-serif text-3xl font-extrabold">ספר ביחד</h1>
            <p className="text-xs text-muted-foreground mt-1">
              בונים הרגל קריאה קטן, יום אחרי יום
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className={activeTab === 'feed' ? "font-semibold text-foreground" : ""}>הפיד</span>
            <span>•</span>
            <span className={activeTab === 'challenges' ? "font-semibold text-foreground" : ""}>אתגרים</span>
            <span>•</span>
            <span className={activeTab === 'books' ? "font-semibold text-foreground" : ""}>ספרים</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 max-w-md mx-auto">
        {activeTab === 'feed' && (
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <>
                <div className="rounded-xl bg-card p-4 card-shadow text-right space-y-1">
                  <p className="text-xs font-semibold text-secondary">קרא עכשיו</p>
                  <p className="text-sm font-hebrew-serif font-bold">התחל את סשן הקריאה הראשון שלך היום</p>
                  <p className="text-xs text-muted-foreground">
                    לחץ על כפתור ▶ במרכז כדי למדוד זמן קריאה.
                  </p>
                </div>
                <div className="rounded-xl bg-card p-4 card-shadow text-right space-y-1">
                  <p className="text-xs font-semibold text-primary">הצעה לאתגר</p>
                  <p className="text-sm font-hebrew-serif font-bold">20 דקות קריאה ביום לשבוע</p>
                  <p className="text-xs text-muted-foreground">
                    אתגר קטן שיעזור לך לבנות רצף ראשון רגוע.
                  </p>
                </div>
                <div className="rounded-xl bg-card p-4 card-shadow text-right space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">טיפ קריאה</p>
                  <p className="text-sm font-hebrew-serif font-bold">5 דקות הן התחלה מצוינת</p>
                  <p className="text-xs text-muted-foreground">
                    גם קטע קצר לפני השינה נחשב — העקביות היא מה שבונה את ההרגל.
                  </p>
                </div>
              </>
            ) : (
              <>
                {sessions.map(session => (
                  <FeedItemCard key={session.id} item={session} />
                ))}
                <div className="rounded-xl border border-dashed border-primary/30 p-4 text-center space-y-1">
                  <p className="text-sm font-semibold">אין עדיין חברים בפיד</p>
                  <p className="text-xs text-muted-foreground">הזמן חבר לקרוא איתך 📖</p>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-3">
            <button className="w-full rounded-xl border-2 border-dashed border-primary/30 py-4 text-primary font-semibold hover:bg-primary/5 transition-colors">
              + הזמן חבר לאתגר ראשון
            </button>
            {mockChallenges.map(c => (
              <ChallengeCard key={c.id} challenge={c} />
            ))}
          </div>
        )}

        {activeTab === 'books' && (
          <div className="space-y-6">
            <AddBookDialog onBookAdded={refetchBooks} />

            {books.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <p className="text-sm font-semibold text-foreground">אין עדיין ספרים ברשימה</p>
                <p className="text-sm text-muted-foreground">הוסף את הספר הראשון שתרצה לקרוא</p>
              </div>
            ) : (
              <>
                {readingBooks.length > 0 && (
                  <section>
                    <h3 className="font-serif font-bold text-base mb-3">קורא עכשיו</h3>
                    <div className="space-y-2">
                      {readingBooks.map(book => (
                        <BookCard key={book.id} book={book} compact onDelete={deleteBook} onLogSaved={handleLogSaved} />
                      ))}
                    </div>
                  </section>
                )}

                {finishedBooks.length > 0 && (
                  <section>
                    <h3 className="font-serif font-bold text-base mb-3">סיימתי</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {finishedBooks.map(book => (
                        <BookCard key={book.id} book={book} onDelete={deleteBook} onLogSaved={handleLogSaved} />
                      ))}
                    </div>
                  </section>
                )}

                {wantBooks.length > 0 && (
                  <section>
                    <h3 className="font-serif font-bold text-base mb-3">רוצה לקרוא</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {wantBooks.map(book => (
                        <BookCard key={book.id} book={book} onDelete={deleteBook} onLogSaved={handleLogSaved} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
