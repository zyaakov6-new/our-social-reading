import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useBooks } from "@/hooks/useBooks";
import { useReadingSessions } from "@/hooks/useReadingSessions";
import { useChallenges } from "@/hooks/useChallenges";
import FeedItemCard from "@/components/FeedItemCard";
import ChallengeCard from "@/components/ChallengeCard";
import BookCard from "@/components/BookCard";
import AddBookDialog from "@/components/AddBookDialog";
import CreateChallengeDialog from "@/components/CreateChallengeDialog";
import Leaderboard from "@/components/Leaderboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";

type Tab = 'feed' | 'challenges' | 'books';

const ChallengesTab = () => {
  const { challenges, loading, joinChallenge } = useChallenges();
  const [createOpen, setCreateOpen] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const handleJoin = async (id: string) => {
    setJoiningId(id);
    try {
      await joinChallenge(id);
    } finally {
      setJoiningId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-2.5 w-full rounded-full" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setCreateOpen(true)}
        className="w-full rounded-xl border-2 border-dashed border-primary/30 py-4 text-primary font-semibold hover:bg-primary/5 transition-colors"
      >
        + צור אתגר חדש
      </button>

      {challenges.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          עדיין אין אתגרים — צור את האתגר הראשון!
        </div>
      ) : (
        challenges.map(c => (
          <div key={c.id} className="space-y-1">
            <ChallengeCard
              challenge={{
                id: c.id,
                name: c.name,
                goalType: c.goalType,
                goalValue: c.goalValue,
                currentProgress: c.myProgress,
                startDate: c.startDate,
                endDate: c.endDate,
                participants: c.participants.map((p, i) => ({ name: p.displayName, progress: p.progress, rank: i + 1 })),
                myRank: c.myRank,
                isParticipant: c.isParticipant,
              }}
            />
            {!c.isParticipant && (
              <button
                onClick={() => handleJoin(c.id)}
                disabled={joiningId === c.id}
                className="w-full rounded-xl py-3 font-bold text-sm text-primary-foreground transition-opacity disabled:opacity-60"
                style={{ background: 'hsl(126 15% 28%)' }}
              >
                {joiningId === c.id ? 'מצטרף...' : 'הצטרף לאתגר 🎯'}
              </button>
            )}
          </div>
        ))
      )}

      <CreateChallengeDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={() => {}} />
    </div>
  );
};

const pathToTab: Record<string, Tab> = {
  '/': 'feed',
  '/challenges': 'challenges',
  '/books': 'books',
};

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>(pathToTab[location.pathname] || 'feed');
  const { books, refetch: refetchBooks, deleteBook, updateStatus } = useBooks();
  const { sessions, loading: sessionsLoading, refetch: refetchSessions } = useReadingSessions();

  const handleLogSaved = () => {
    refetchBooks();
    refetchSessions();
  };

  // Auto-refresh library when a book is added from the feed
  useEffect(() => {
    const handler = () => refetchBooks();
    window.addEventListener('bookAdded', handler);
    return () => window.removeEventListener('bookAdded', handler);
  }, []);

  useEffect(() => {
    const tab = pathToTab[location.pathname];
    if (tab) setActiveTab(tab);
  }, [location.pathname]);


  const readingBooks = books.filter(b => b.status === 'reading');
  const finishedBooks = books.filter(b => b.status === 'finished');
  const wantBooks = books.filter(b => b.status === 'want');

  return (
    <div className="min-h-screen pb-28">
      {/* Compact top bar */}
      <div
        className="sticky top-0 z-30 backdrop-blur-md px-5 pt-3 pb-2.5"
        style={{
          background: 'linear-gradient(to bottom, hsl(44 32% 88% / 0.97) 0%, hsl(44 27% 84% / 0.97) 100%)',
          borderBottom: '2px solid hsl(126 15% 28% / 0.20)',
        }}
      >
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <span style={{ display: 'block', width: '3px', height: '26px', background: 'hsl(126 15% 28%)', borderRadius: '2px', flexShrink: 0 }} />
          <div>
            <h1 className="font-display text-[1.5rem] tracking-[0.14em] leading-none">AMUD</h1>
            <p className="font-quote text-[10px] text-muted-foreground mt-0.5">פיד קריאה</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 max-w-md mx-auto">
        {activeTab === 'feed' && (
          <div className="space-y-3">
            <Leaderboard />
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
              {sessions.every(s => s.isMe) && (
                <button
                  onClick={() => {
                    const url = window.location.origin;
                    const text = "הצטרפ/י לAMUD - האפליקציה שעוזרת לנו לקרוא יותר ביחד! 📚";
                    if (navigator.share) {
                      navigator.share({ title: "AMUD - קריאה חברתית", text, url }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(`${text}\n${url}`);
                      import("sonner").then(({ toast }) => toast.success("הקישור הועתק ללוח!"));
                    }
                  }}
                  className="w-full rounded-xl p-4 text-center space-y-1 transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: 'hsl(126 15% 28%)', color: 'hsl(44 30% 93%)' }}
                >
                  <p className="text-sm font-bold">📖 הזמן חבר לקרוא איתך</p>
                  <p className="text-xs opacity-80">לחץ לשיתוף הזמנה לאפליקציה</p>
                </button>
              )}
              </>
            )/* end sessionsLoading ternary */}
          </div>
        )}

        {activeTab === 'challenges' && (
          <ChallengesTab />
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
