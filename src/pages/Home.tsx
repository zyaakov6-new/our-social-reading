import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { mockChallenges } from "@/lib/mockData";
import { useBooks } from "@/hooks/useBooks";
import { useReadingSessions } from "@/hooks/useReadingSessions";
import FeedItemCard from "@/components/FeedItemCard";
import ChallengeCard from "@/components/ChallengeCard";
import BookCard from "@/components/BookCard";
import AddBookDialog from "@/components/AddBookDialog";
import { Skeleton } from "@/components/ui/skeleton";

type Tab = 'feed' | 'challenges' | 'books';

const pathToTab: Record<string, Tab> = {
  '/': 'feed',
  '/challenges': 'challenges',
  '/books': 'books',
};

const Home = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>(pathToTab[location.pathname] || 'feed');
  const { books, refetch: refetchBooks, deleteBook, updateStatus } = useBooks();
  const { sessions, loading: sessionsLoading, refetch: refetchSessions } = useReadingSessions();

  const handleLogSaved = () => {
    refetchBooks();
    refetchSessions();
  };

  useEffect(() => {
    const tab = pathToTab[location.pathname];
    if (tab) setActiveTab(tab);
  }, [location.pathname]);


  const readingBooks = books.filter(b => b.status === 'reading');
  const finishedBooks = books.filter(b => b.status === 'finished');
  const wantBooks = books.filter(b => b.status === 'want');

  return (
    <div className="min-h-screen pb-28">
      {/* ── App header: Pillar mark + wordmark ──────────────────── */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/40 px-5 pt-5 pb-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            {/* The Amud pillar line */}
            <span className="amud-pillar h-11" />
            <div>
              <h1 className="font-display text-4xl tracking-[0.18em] leading-none">AMUD</h1>
              <p className="font-quote text-[11px] text-muted-foreground mt-0.5" style={{ fontStyle: 'italic' }}>
                בונים הרגל, עמוד אחרי עמוד
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 max-w-md mx-auto">
        {activeTab === 'feed' && (
          <div className="space-y-3">
            {sessionsLoading ? (
              <>
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4 rounded" />
                        <Skeleton className="h-3 w-1/3 rounded" />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1 border-t border-border/40">
                      <Skeleton className="h-7 w-12 rounded-lg" />
                      <Skeleton className="h-7 w-12 rounded-lg" />
                    </div>
                  </div>
                ))}
              </>
            ) : sessions.length === 0 ? (
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
            )/* end sessionsLoading ternary */}
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
                    <h3 className="section-heading mb-4">קורא עכשיו</h3>
                    <div className="space-y-2">
                      {readingBooks.map(book => (
                        <BookCard key={book.id} book={book} compact onDelete={deleteBook} onLogSaved={handleLogSaved} onStatusChange={updateStatus} />
                      ))}
                    </div>
                  </section>
                )}

                {finishedBooks.length > 0 && (
                  <section>
                    <h3 className="section-heading mb-4">סיימתי</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {finishedBooks.map(book => (
                        <BookCard key={book.id} book={book} onDelete={deleteBook} onLogSaved={handleLogSaved} onStatusChange={updateStatus} />
                      ))}
                    </div>
                  </section>
                )}

                {wantBooks.length > 0 && (
                  <section>
                    <h3 className="section-heading mb-4">רוצה לקרוא</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {wantBooks.map(book => (
                        <BookCard key={book.id} book={book} onDelete={deleteBook} onLogSaved={handleLogSaved} onStatusChange={updateStatus} />
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
