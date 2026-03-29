import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Trophy, Target, Pencil, Check, Flame, Clock, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { ReadingSession } from "@/hooks/useReadingSessions";

const GUEST_DEMO_SESSIONS: ReadingSession[] = [
  { id: 'demo-1', userId: 'u1', bookId: '', bookTitle: 'הסופרלנד', bookAuthor: 'ניר ברם', userName: 'יעל כ׳', minutesRead: 45, pagesRead: 32, sessionDate: '', timestamp: 'לפני 2 שעות', likes: 0, comments: 0, isMe: false },
  { id: 'demo-2', userId: 'u2', bookId: '', bookTitle: '1984', bookAuthor: "ג'ורג' אורוול", userName: 'דני ל׳', minutesRead: 30, pagesRead: 18, sessionDate: '', timestamp: 'לפני 4 שעות', likes: 0, comments: 0, isMe: false },
  { id: 'demo-3', userId: 'u3', bookId: '', bookTitle: 'האדם מחפש משמעות', bookAuthor: 'ויקטור פרנקל', userName: 'מיכל א׳', minutesRead: 60, pagesRead: 42, sessionDate: '', timestamp: 'לפני 6 שעות', likes: 0, comments: 0, isMe: false },
];

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
          הצטרף לאתגרים עם חברים - מי יקרא הכי הרבה דקות השבוע?
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
        {/* Animated trophy loader */}
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <div className="relative">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              {/* Spinning ring */}
              <circle cx="26" cy="26" r="22" stroke="hsl(44 15% 80%)" strokeWidth="3" fill="none" />
              <circle
                cx="26" cy="26" r="22"
                stroke="hsl(126 15% 28%)"
                strokeWidth="3"
                fill="none"
                strokeDasharray="34 104"
                strokeLinecap="round"
                style={{ transformOrigin: '26px 26px', animation: 'spin 1s linear infinite' }}
              />
              {/* Trophy icon center */}
              <text x="26" y="32" textAnchor="middle" fontSize="20" style={{ userSelect: 'none' }}>🏆</text>
            </svg>
          </div>
          <p className="text-sm font-semibold text-muted-foreground animate-pulse">טוען אתגרים...</p>
        </div>

        {/* Challenge card skeletons with shimmer */}
        {[1, 2].map(i => (
          <div
            key={i}
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid hsl(44 15% 80%)', background: 'hsl(44 27% 88%)' }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid hsl(44 12% 80%)' }}>
              <Skeleton className="h-3 w-20 rounded-full" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
            {/* Progress */}
            <div className="px-4 py-3 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-8 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
            {/* Avatars */}
            <div className="flex items-center gap-2 px-4 pb-3">
              {[1, 2, 3].map(j => (
                <Skeleton key={j} className="h-7 w-7 rounded-full flex-shrink-0" style={{ marginRight: j > 1 ? '-8px' : '0' }} />
              ))}
              <Skeleton className="h-3 w-20 rounded mr-3" />
            </div>
          </div>
        ))}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
          עדיין אין אתגרים - צור את האתגר הראשון!
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

/* ── Personal Stats Card ─────────────────────────────────────────── */
interface PersonalStatsCardProps {
  sessions: ReadingSession[];
  finishedCount: number;
}
const PersonalStatsCard = ({ sessions, finishedCount }: PersonalStatsCardProps) => {
  const { user } = useAuth();
  const [yearlyGoal, setYearlyGoal] = useState(12);
  const [editingYearlyGoal, setEditingYearlyGoal] = useState(false);
  const [yearlyDraft, setYearlyDraft] = useState('');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(20);

  const mySessions = useMemo(() => sessions.filter(s => s.isMe), [sessions]);

  const streak = useMemo(() => {
    if (!mySessions.length) return 0;
    const now = new Date();
    const toDateStr = (d: Date) => d.toISOString().split('T')[0];
    const today = toDateStr(now);
    const yesterday = toDateStr(new Date(now.getTime() - 86400000));
    const uniqueDates = new Set(mySessions.map(s => s.sessionDate.substring(0, 10)));
    const startOffset = uniqueDates.has(today) ? 0 : uniqueDates.has(yesterday) ? 1 : -1;
    if (startOffset === -1) return 0;
    let count = 0;
    for (let i = startOffset; ; i++) {
      if (uniqueDates.has(toDateStr(new Date(now.getTime() - i * 86400000)))) count++;
      else break;
    }
    return count;
  }, [mySessions]);

  const weekMinutes = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return mySessions.filter(s => new Date(s.sessionDate) >= weekAgo).reduce((sum, s) => sum + s.minutesRead, 0);
  }, [mySessions]);

  const todayMinutes = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return mySessions.filter(s => s.sessionDate.substring(0, 10) === today).reduce((sum, s) => sum + s.minutesRead, 0);
  }, [mySessions]);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('yearly_goal_books, reading_goal_minutes').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data?.yearly_goal_books) setYearlyGoal(data.yearly_goal_books);
        if (data?.reading_goal_minutes) setDailyGoalMinutes(data.reading_goal_minutes);
      });
  }, [user?.id]);

  const saveYearlyGoal = async () => {
    const n = parseInt(yearlyDraft, 10);
    if (!n || n < 1 || !user) { setEditingYearlyGoal(false); return; }
    setYearlyGoal(n);
    setEditingYearlyGoal(false);
    await supabase.from('profiles').update({ yearly_goal_books: n }).eq('user_id', user.id);
  };

  const year = new Date().getFullYear();
  const yearlyPct = Math.min(100, Math.round((finishedCount / yearlyGoal) * 100));
  const dailyPct = Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100));
  const dailyDone = todayMinutes >= dailyGoalMinutes;

  const fmtMinutes = (m: number) => {
    if (m < 60) return { val: String(m), unit: 'דקות' };
    const h = Math.floor(m / 60), rem = m % 60;
    return { val: rem > 0 ? `${h}:${String(rem).padStart(2, '0')}` : `${h}`, unit: 'שעות' };
  };
  const week = fmtMinutes(weekMinutes);

  return (
    <div className="rounded-xl bg-card p-4 card-shadow space-y-3">
      {/* 3-stat row */}
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col items-center py-2.5 rounded-xl" style={{ background: 'hsl(28 71% 57% / 0.10)' }}>
          <Flame size={19} style={{ color: 'hsl(28 71% 57%)' }} />
          <span className="text-2xl font-extrabold leading-none mt-1" style={{ color: 'hsl(28 71% 45%)' }}>{streak}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">יום רצף</span>
        </div>
        <div className="flex-1 flex flex-col items-center py-2.5 rounded-xl" style={{ background: 'hsl(188 60% 35% / 0.08)' }}>
          <Clock size={19} style={{ color: 'hsl(188 60% 35%)' }} />
          <span className="text-2xl font-extrabold leading-none mt-1" style={{ color: 'hsl(188 60% 35%)' }}>{week.val}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">{week.unit} השבוע</span>
        </div>
        <div className="flex-1 flex flex-col items-center py-2.5 rounded-xl" style={{ background: 'hsl(126 15% 28% / 0.08)' }}>
          <BookOpen size={19} style={{ color: 'hsl(126 15% 28%)' }} />
          <span className="text-2xl font-extrabold leading-none mt-1" style={{ color: 'hsl(126 15% 28%)' }}>{finishedCount}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">ספרים</span>
        </div>
      </div>

      {/* Daily goal */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold" style={{ color: dailyDone ? 'hsl(126 15% 28%)' : 'hsl(28 71% 45%)' }}>
            {dailyDone ? '✓ יעד יומי הושג!' : 'יעד יומי'}
          </span>
          <span className="text-[11px] text-muted-foreground">{todayMinutes}/{dailyGoalMinutes} דקות היום</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${dailyPct}%`,
              background: dailyDone ? 'hsl(126 15% 28%)' : 'hsl(28 71% 57%)',
            }}
          />
        </div>
      </div>

      {/* Yearly goal */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold" style={{ color: 'hsl(126 15% 28%)' }}>יעד {year}</span>
          {!editingYearlyGoal ? (
            <button
              onClick={() => { setYearlyDraft(String(yearlyGoal)); setEditingYearlyGoal(true); }}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground touch-manipulation"
            >
              <Pencil size={10} /> {finishedCount}/{yearlyGoal} ספרים
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="number" value={yearlyDraft} onChange={e => setYearlyDraft(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveYearlyGoal()}
                autoFocus min={1}
                className="w-12 rounded-lg border border-border bg-background px-2 py-0.5 text-xs text-center"
              />
              <button onClick={saveYearlyGoal} className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center touch-manipulation">
                <Check size={11} style={{ color: 'hsl(126 15% 28%)' }} />
              </button>
            </div>
          )}
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${yearlyPct}%`, background: 'linear-gradient(to left, hsl(126 15% 28%), hsl(188 60% 35%))' }}
          />
        </div>
      </div>
    </div>
  );
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
            {user && <PersonalStatsCard sessions={sessions} finishedCount={finishedBooks.length} />}
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
            ) : !user && sessions.length === 0 ? (
              <>
                {GUEST_DEMO_SESSIONS.map(s => (
                  <FeedItemCard key={s.id} item={s} />
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
                    גם קטע קצר לפני השינה נחשב - העקביות היא מה שבונה את ההרגל.
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
            {/* Add book - gated for guests */}
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

            {/* Reading goal - authenticated only */}
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
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
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
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
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
