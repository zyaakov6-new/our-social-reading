import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useBooks } from "@/hooks/useBooks";
import { useReadingSessions } from "@/hooks/useReadingSessions";
import { useChallenges } from "@/hooks/useChallenges";
import { useAuth } from "@/contexts/AuthContext";
import FeedItemCard from "@/components/FeedItemCard";
import ChallengeCard from "@/components/ChallengeCard";
import BookCard from "@/components/BookCard";
import AddBookDialog from "@/components/AddBookDialog";
import AuthGateModal from "@/components/AuthGateModal";
import CreateChallengeDialog from "@/components/CreateChallengeDialog";
import Leaderboard from "@/components/Leaderboard";
import BookRecommendations from "@/components/BookRecommendations";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Target, Pencil, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Tab = 'feed' | 'challenges' | 'books';

const ChallengesTab = () => {
  const { user } = useAuth();
  const { challenges, loading, joinChallenge } = useChallenges();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 px-4">
        <div className="text-4xl">🏆</div>
        <h3 className="font-serif font-bold text-lg">אתגרי קריאה</h3>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          הצטרף לאתגרים עם חברים — מי יקרא הכי הרבה דקות השבוע?
        </p>
        <button
          onClick={() => window.location.href = "/auth"}
          className="mt-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
          style={{ background: 'hsl(126 15% 28%)' }}
        >
          הצטרף כדי להשתתף ←
        </button>
      </div>
    );
  }
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
  '/feed': 'feed',
  '/challenges': 'challenges',
  '/books': 'books',
};

/* ── Reading Goal Banner ─────────────────────────────────────────── */
interface GoalBannerProps {
  finishedCount: number;
}
const ReadingGoalBanner = ({ finishedCount }: GoalBannerProps) => {
  const { user } = useAuth();
  const [goal, setGoal] = useState<number>(12);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("yearly_goal_books")
      .eq("user_id", user.id)
      .single();
    if (data?.yearly_goal_books) setGoal(data.yearly_goal_books);
    setLoaded(true);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    const n = parseInt(draft, 10);
    if (!n || n < 1 || !user) { setEditing(false); return; }
    setGoal(n);
    setEditing(false);
    await supabase.from("profiles").update({ yearly_goal_books: n }).eq("user_id", user.id);
  };

  if (!loaded) return null;

  const pct = Math.min(100, Math.round((finishedCount / goal) * 100));
  const year = new Date().getFullYear();

  return (
    <div className="rounded-xl bg-card p-4 card-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target size={15} strokeWidth={1.8} style={{ color: 'hsl(188 100% 27%)' }} />
          <span className="text-sm font-bold">יעד קריאה {year}</span>
        </div>
        {!editing ? (
          <button
            onClick={() => { setDraft(String(goal)); setEditing(true); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil size={11} /> שנה יעד
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              autoFocus
              min={1}
              className="w-14 rounded-lg border border-border bg-background px-2 py-1 text-sm text-center"
            />
            <button onClick={save} className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Check size={12} style={{ color: 'hsl(126 15% 28%)' }} />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between mb-2">
        <span className="text-3xl font-extrabold font-numbers leading-none" style={{ color: 'hsl(188 100% 27%)' }}>
          {finishedCount}
        </span>
        <span className="text-sm text-muted-foreground">מתוך {goal} ספרים</span>
      </div>

      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: 'hsl(188 100% 27%)' }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 text-left">{pct}%</p>
    </div>
  );
};

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(pathToTab[location.pathname] || 'feed');
  const [addBookGateOpen, setAddBookGateOpen] = useState(false);
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
            {/* Guest preview banner */}
            {!user && (
              <div className="rounded-xl p-4 text-center space-y-2"
                style={{ background: 'hsl(126 15% 28% / 0.07)', border: '1px solid hsl(126 15% 28% / 0.15)' }}>
                <p className="text-sm font-bold">רואים את הקהילה בפעולה</p>
                <p className="text-xs text-muted-foreground">הצטרף כדי לרשום קריאות, לתחרות עם חברים ולהופיע בדירוג</p>
                <button
                  onClick={() => navigate("/auth")}
                  className="mt-1 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: 'hsl(126 15% 28%)' }}
                >
                  הצטרף חינם ←
                </button>
              </div>
            )}
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
            {/* Add book — gated for guests */}
            {user ? (
              <AddBookDialog onBookAdded={refetchBooks} />
            ) : (
              <button
                onClick={() => setAddBookGateOpen(true)}
                className="w-full rounded-xl border-2 border-dashed border-primary/30 py-4 text-primary font-semibold hover:bg-primary/5 transition-colors"
              >
                + הוסף ספר
              </button>
            )}
            <AuthGateModal
              open={addBookGateOpen}
              onClose={() => setAddBookGateOpen(false)}
              action="להוסיף ספר"
            />

            {user && <BookRecommendations books={books} />}

            {/* Reading goal — authenticated only */}
            {user && <ReadingGoalBanner finishedCount={finishedBooks.length} />}

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
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="section-heading">סיימתי</h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'hsl(188 100% 27% / 0.12)', color: 'hsl(188 100% 27%)' }}>
                        {finishedBooks.length}
                      </span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {finishedBooks.map(book => (
                        <BookCard key={book.id} book={book} onDelete={deleteBook} onLogSaved={handleLogSaved} onStatusChange={updateStatus} />
                      ))}
                    </div>
                  </section>
                )}

                {wantBooks.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="section-heading">רוצה לקרוא</h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'hsl(28 71% 57% / 0.12)', color: 'hsl(28 71% 45%)' }}>
                        {wantBooks.length}
                      </span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {wantBooks.map(book => (
                        <BookCard key={book.id} book={book} onDelete={deleteBook} onLogSaved={handleLogSaved} onStatusChange={updateStatus} />
                      ))}
                    </div>
                    {wantBooks.length > 0 && (
                      <p className="text-xs text-muted-foreground text-center mt-1">
                        לחץ על ספר מהרשימה כדי להתחיל לקרוא
                      </p>
                    )}
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
