import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { searchBooks, BookSearchResult } from "@/services/googleBooks";
import { Search, UserPlus, Check, ArrowLeft } from "lucide-react";

const ONBOARDING_STATUS_EVENT = "onboarding-status-changed";

const C = {
  green:  'hsl(126 15% 28%)',
  teal:   'hsl(188 60% 35%)',
  orange: 'hsl(28 71% 57%)',
  muted:  'hsl(44 12% 55%)',
};

const LEADERBOARD_DEMO = [
  { name: 'יעל כהן',   books: 5, rank: 1 },
  { name: 'דניאל לוי', books: 4, rank: 2 },
  { name: 'אתה',       books: 3, rank: 3, highlight: true },
  { name: 'שירה א׳',  books: 2, rank: 4 },
];

const GENRES = ['ספרות עברית', 'מתח ומסתורין', 'מד"ב / פנטזיה', 'עיון ופילוסופיה', 'רומן', 'היסטוריה'];
const BOOKS_PER_YEAR_OPTIONS = [
  { value: '0-5',  label: '0–5',  sub: 'קורא רגוע' },
  { value: '6-12', label: '6–12', sub: 'ספר בחודש' },
  { value: '13+',  label: '13+',  sub: 'קורא נמרץ' },
];

const LeaderboardSlide = () => (
  <div className="w-full rounded-2xl overflow-hidden" style={{ border: '1px solid hsl(44 15% 80%)', background: 'hsl(44 30% 96%)' }}>
    <div className="px-4 py-2.5 text-xs font-bold flex items-center gap-1.5"
      style={{ borderBottom: '1px solid hsl(44 15% 80%)', color: 'hsl(126 15% 28%)' }}>
      🏆 לוח תוצאות — החודש
    </div>
    {LEADERBOARD_DEMO.map(r => (
      <div key={r.rank} className="flex items-center gap-3 px-4 py-2.5"
        style={{
          borderBottom: '1px solid hsl(44 15% 84%)',
          background: (r as any).highlight ? 'hsl(126 15% 28% / 0.07)' : undefined,
        }}>
        <span className="text-sm w-5 text-center">{r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}</span>
        <span className="flex-1 text-xs font-semibold" style={{ color: (r as any).highlight ? 'hsl(126 15% 28%)' : 'inherit' }}>
          {r.name}{(r as any).highlight && ' ← אתה'}
        </span>
        <span className="text-xs font-bold" style={{ color: 'hsl(188 60% 35%)' }}>{r.books} ספרים</span>
      </div>
    ))}
    <div className="px-4 py-2 text-center text-[11px] font-semibold" style={{ color: 'hsl(28 71% 57%)' }}>
      ✨ יעל קראה 5 ספרים — אתה יכול לנצח!
    </div>
  </div>
);

const ActivitySlide = () => (
  <div className="space-y-2">
    {[
      { name: 'יעל',  action: 'הוסיפה', book: '"ילדה, אישה, אחרת"', time: 'לפני שעה', emoji: '📖' },
      { name: 'דני',  action: 'סיים',   book: '"1984"',             time: 'אתמול',    emoji: '✅' },
      { name: 'מיכל', action: 'קוראת',  book: '"הסיפור של שפחה"', time: 'עכשיו',    emoji: '🔥' },
    ].map(item => (
      <div key={item.name} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
        style={{ background: 'hsl(44 30% 96%)', border: '1px solid hsl(44 15% 80%)' }}>
        <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
          style={{ background: 'hsl(126 15% 28%)' }}>{item.name[0]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs leading-snug">
            <span className="font-bold">{item.name}</span>{' '}{item.action}{' '}
            <span style={{ color: 'hsl(188 60% 35%)' }}>{item.book}</span>
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'hsl(44 12% 55%)' }}>{item.time}</p>
        </div>
        <span className="text-base">{item.emoji}</span>
      </div>
    ))}
  </div>
);

const ProgressSlide = () => (
  <div className="space-y-2.5">
    {[
      { title: '"הארי פוטר ואבן החכמים"', pct: 68, pages: '245/309', done: false },
      { title: '"1984"', pct: 100, pages: '328/328', done: true },
      { title: '"הנביא"', pct: 15, pages: '22/96', done: false },
    ].map(book => (
      <div key={book.title} className="rounded-xl px-4 py-3 space-y-1.5"
        style={{ background: 'hsl(44 30% 96%)', border: '1px solid hsl(44 15% 80%)' }}>
        <div className="flex items-center justify-between">
          <span className="text-[10px]" style={{ color: 'hsl(44 12% 55%)' }}>{book.pages}</span>
          <span className="text-xs font-semibold truncate max-w-[170px]">{book.title}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'hsl(44 15% 84%)' }}>
          <div className="h-full rounded-full" style={{ width: `${book.pct}%`, background: book.done ? 'hsl(28 71% 57%)' : 'hsl(126 15% 28%)' }} />
        </div>
        {book.done && <p className="text-[10px] font-semibold text-right" style={{ color: 'hsl(28 71% 57%)' }}>✓ הושלם</p>}
      </div>
    ))}
  </div>
);

const SLIDES = [
  { label: '🏆 לוח תוצאות',   component: <LeaderboardSlide /> },
  { label: '👥 פעילות חברים', component: <ActivitySlide /> },
  { label: '📊 מעקב ספרים',   component: <ProgressSlide /> },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [slide, setSlide] = useState(0);
  const slideTimer = useRef<ReturnType<typeof setInterval>>();

  const [name, setName] = useState('');
  const [booksPerYear, setBooksPerYear] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const [friendQuery, setFriendQuery] = useState('');
  const [friendResults, setFriendResults] = useState<{ userId: string; displayName: string }[]>([]);
  const [addedFriends, setAddedFriends] = useState<Set<string>>(new Set());
  const [searchingFriends, setSearchingFriends] = useState(false);
  const friendDebounce = useRef<ReturnType<typeof setTimeout>>();

  const [bookQuery, setBookQuery] = useState('');
  const [bookResults, setBookResults] = useState<BookSearchResult[]>([]);
  const [searchingBooks, setSearchingBooks] = useState(false);
  const [addedBook, setAddedBook] = useState(false);
  const bookDebounce = useRef<ReturnType<typeof setTimeout>>();

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (step !== 0) return;
    slideTimer.current = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 3000);
    return () => clearInterval(slideTimer.current);
  }, [step]);

  const goSlide = (i: number) => {
    clearInterval(slideTimer.current);
    setSlide(i);
  };

  useEffect(() => {
    if (!friendQuery.trim() || friendQuery.trim().length < 2) { setFriendResults([]); return; }
    clearTimeout(friendDebounce.current);
    friendDebounce.current = setTimeout(async () => {
      setSearchingFriends(true);
      try {
        const { data } = await supabase.from('profiles').select('user_id, display_name')
          .ilike('display_name', `%${friendQuery.trim()}%`).limit(5);
        const { data: { user } } = await supabase.auth.getUser();
        setFriendResults(
          (data ?? []).filter((r: any) => r.user_id !== user?.id && r.display_name)
            .map((r: any) => ({ userId: r.user_id, displayName: r.display_name }))
        );
      } finally { setSearchingFriends(false); }
    }, 400);
    return () => clearTimeout(friendDebounce.current);
  }, [friendQuery]);

  const handleAddFriend = async (userId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('friendships').upsert(
      { requester_id: user.id, addressee_id: userId, status: 'pending' },
      { onConflict: 'requester_id,addressee_id' }
    );
    setAddedFriends(prev => new Set([...prev, userId]));
  };

  useEffect(() => {
    if (!bookQuery.trim() || bookQuery.trim().length < 2) { setBookResults([]); return; }
    clearTimeout(bookDebounce.current);
    bookDebounce.current = setTimeout(async () => {
      setSearchingBooks(true);
      try { setBookResults((await searchBooks(bookQuery)).slice(0, 6)); }
      finally { setSearchingBooks(false); }
    }, 400);
    return () => clearTimeout(bookDebounce.current);
  }, [bookQuery]);

  const handleAddBook = async (book: BookSearchResult) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('books').insert({
      user_id: user.id, title: book.title, author: book.author,
      total_pages: book.totalPages, cover_url: book.coverUrl, current_page: 0, status: 'reading',
    });
    window.dispatchEvent(new CustomEvent('bookAdded'));
    setAddedBook(true);
    setTimeout(handleFinish, 1200);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const goalMinutes = booksPerYear === '13+' ? 45 : booksPerYear === '6-12' ? 30 : 20;
        await Promise.all([
          supabase.auth.updateUser({ data: { full_name: name.trim() || undefined } }),
          supabase.from('profiles').upsert({
            user_id: user.id, display_name: name.trim() || null,
            reading_goal_minutes: goalMinutes, books_per_year: booksPerYear || null,
            genres: selectedGenres.length > 0 ? selectedGenres : null,
          }, { onConflict: 'user_id' }),
        ]);
      }
    } catch (e) { console.warn('Onboarding save failed:', e); }
    localStorage.setItem('onboarding_complete', 'true');
    window.dispatchEvent(new Event(ONBOARDING_STATUS_EVENT));
    navigate('/', { replace: true });
  };

  const toggleGenre = (g: string) =>
    setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  return (
    <div dir="rtl" className="min-h-screen flex flex-col" style={{ background: 'hsl(44 27% 93%)' }}>

      <div className="flex justify-center gap-2 pt-8 pb-2 flex-shrink-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-1.5 rounded-full transition-all duration-300"
            style={{ width: i === step ? 28 : 8, background: i <= step ? 'hsl(126 15% 28%)' : 'hsl(44 15% 75%)' }} />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        <AnimatePresence mode="wait">

          {step === 0 && (
            <motion.div key="welcome"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.28 }}
              className="flex flex-col items-center pt-6 pb-4 gap-5 max-w-sm mx-auto"
            >
              <div className="text-center space-y-2">
                <h1 className="font-display text-4xl tracking-[0.16em]" style={{ color: 'hsl(126 15% 28%)' }}>AMUD</h1>
                <p className="font-serif text-xl font-bold leading-snug">קוראים יותר, ביחד! 📚</p>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px] mx-auto">
                  תתחרה עם חברים, ראה מה הם קוראים, ועקוב אחרי הספרים שלך
                </p>
              </div>

              <div className="w-full space-y-3">
                <div className="flex gap-1.5 justify-center flex-wrap">
                  {SLIDES.map((s, i) => (
                    <button key={i} onClick={() => goSlide(i)}
                      className="text-[11px] px-2.5 py-1 rounded-full font-medium transition-all"
                      style={i === slide
                        ? { background: 'hsl(126 15% 28%)', color: 'white' }
                        : { background: 'hsl(44 15% 84%)', color: 'hsl(44 12% 55%)' }}
                    >{s.label}</button>
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={slide}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}>
                    {SLIDES[slide].component}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="profile"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.28 }}
              className="flex flex-col pt-4 pb-4 gap-5 max-w-sm mx-auto"
            >
              <div className="text-center space-y-1">
                <p className="text-2xl">👋</p>
                <h2 className="font-serif text-xl font-bold">מי אתה כקורא?</h2>
                <p className="text-xs text-muted-foreground">כמה פרטים קטנים כדי להתאים לך את החוויה</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">שם תצוגה</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="השם שלך בקהילה" dir="rtl"
                  className="w-full text-sm rounded-xl px-4 py-3 outline-none transition-colors"
                  style={{ background: 'hsl(44 25% 97%)', border: '1.5px solid hsl(44 15% 80%)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'hsl(126 15% 28%)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'hsl(44 15% 80%)')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">כמה ספרים אתה קורא בשנה?</label>
                <div className="grid grid-cols-3 gap-2">
                  {BOOKS_PER_YEAR_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setBooksPerYear(opt.value)}
                      className="flex flex-col items-center py-3.5 rounded-xl transition-all"
                      style={booksPerYear === opt.value
                        ? { background: 'hsl(126 15% 28%)', color: 'white' }
                        : { background: 'hsl(44 25% 97%)', border: '1.5px solid hsl(44 15% 80%)' }
                      }
                    >
                      <span className="text-lg font-bold leading-none">{opt.label}</span>
                      <span className="text-[10px] mt-1 opacity-75">{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">ז׳אנרים מועדפים (אפשר כמה)</label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(g => {
                    const sel = selectedGenres.includes(g);
                    return (
                      <button key={g} onClick={() => toggleGenre(g)}
                        className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                        style={sel
                          ? { background: 'hsl(188 60% 35%)', color: 'white' }
                          : { background: 'hsl(44 25% 97%)', border: '1.5px solid hsl(44 15% 80%)', color: 'hsl(126 10% 35%)' }
                        }
                      >
                        {sel && '✓ '}{g}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="friends"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.28 }}
              className="flex flex-col pt-4 pb-4 gap-4 max-w-sm mx-auto"
            >
              <div className="text-center space-y-1">
                <p className="text-2xl">🏅</p>
                <h2 className="font-serif text-xl font-bold">חבר חברים להתחרות!</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">כשיש עם מי להתחרות, קוראים הרבה יותר</p>
              </div>

              <div className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid hsl(44 15% 80%)', background: 'hsl(44 30% 96%)' }}>
                <div className="px-3 py-2 text-xs font-bold flex items-center gap-1.5"
                  style={{ borderBottom: '1px solid hsl(44 15% 80%)', color: 'hsl(126 15% 28%)' }}>
                  🏆 כך ייראה הדירוג שלך
                </div>
                {LEADERBOARD_DEMO.map(r => (
                  <div key={r.rank} className="flex items-center gap-2.5 px-3 py-2 text-xs"
                    style={{
                      borderBottom: '1px solid hsl(44 15% 84%)',
                      background: (r as any).highlight ? 'hsl(126 15% 28% / 0.07)' : undefined,
                    }}>
                    <span className="w-4 text-center">{r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}</span>
                    <span className="flex-1 font-semibold" style={{ color: (r as any).highlight ? 'hsl(126 15% 28%)' : 'inherit' }}>
                      {r.name}{(r as any).highlight && ' ← אתה'}
                    </span>
                    <span className="font-bold" style={{ color: 'hsl(188 60% 35%)' }}>{r.books} ספרים</span>
                  </div>
                ))}
                <div className="px-3 py-2 text-center text-[11px] font-semibold" style={{ color: 'hsl(28 71% 57%)' }}>
                  ✨ יעל קראה 5 ספרים — אתה יכול לנצח!
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">חפש חבר לפי שם</label>
                <div className="relative">
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input value={friendQuery} onChange={e => setFriendQuery(e.target.value)}
                    placeholder="שם המשתמש..." dir="rtl"
                    className="w-full text-sm rounded-xl pr-9 pl-4 py-3 outline-none"
                    style={{ background: 'hsl(44 25% 97%)', border: '1.5px solid hsl(44 15% 80%)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'hsl(126 15% 28%)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'hsl(44 15% 80%)')}
                  />
                  {searchingFriends && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 animate-spin"
                      style={{ borderColor: 'hsl(126 15% 28% / 0.25)', borderTopColor: 'hsl(126 15% 28%)' }} />
                  )}
                </div>

                {friendResults.length > 0 && (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(44 15% 80%)' }}>
                    {friendResults.map(fr => (
                      <div key={fr.userId} className="flex items-center gap-3 px-3 py-2.5"
                        style={{ borderBottom: '1px solid hsl(44 15% 84%)', background: 'hsl(44 25% 97%)' }}>
                        <div className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                          style={{ background: 'hsl(126 15% 28%)' }}>{fr.displayName[0]}</div>
                        <span className="flex-1 text-sm font-medium">{fr.displayName}</span>
                        <button onClick={() => handleAddFriend(fr.userId)} disabled={addedFriends.has(fr.userId)}
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                          style={addedFriends.has(fr.userId)
                            ? { background: 'hsl(126 15% 28% / 0.12)', color: 'hsl(126 15% 28%)' }
                            : { background: 'hsl(126 15% 28%)', color: 'white' }
                          }
                        >
                          {addedFriends.has(fr.userId) ? <><Check size={12} /> נשלח</> : <><UserPlus size={12} /> הוסף</>}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {friendQuery.length > 1 && !searchingFriends && friendResults.length === 0 && (
                  <p className="text-xs text-center text-muted-foreground py-2">לא נמצאו משתמשים</p>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="book"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.28 }}
              className="flex flex-col pt-4 pb-4 gap-4 max-w-sm mx-auto"
            >
              <div className="text-center space-y-1">
                <p className="text-2xl">📖</p>
                <h2 className="font-serif text-xl font-bold">איזה ספר אתה קורא עכשיו?</h2>
                <p className="text-xs text-muted-foreground">הוסף ספר אחד — נתחיל לעקוב אחרי ההתקדמות שלך</p>
              </div>

              <div className="relative">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input value={bookQuery} onChange={e => setBookQuery(e.target.value)}
                  placeholder="חפש ספר לפי שם או מחבר..." dir="rtl" autoFocus
                  className="w-full text-sm rounded-xl pr-9 pl-4 py-3 outline-none"
                  style={{ background: 'hsl(44 25% 97%)', border: '1.5px solid hsl(44 15% 80%)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'hsl(126 15% 28%)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'hsl(44 15% 80%)')}
                />
                {searchingBooks && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 animate-spin"
                    style={{ borderColor: 'hsl(126 15% 28% / 0.25)', borderTopColor: 'hsl(126 15% 28%)' }} />
                )}
              </div>

              {bookResults.length > 0 && !addedBook && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(44 15% 80%)' }}>
                  {bookResults.map(book => (
                    <button key={book.googleBooksId} onClick={() => handleAddBook(book)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-right transition-colors"
                      style={{ background: 'hsl(44 25% 97%)', borderBottom: '1px solid hsl(44 15% 84%)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'hsl(44 20% 91%)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'hsl(44 25% 97%)')}
                    >
                      <div className="h-12 w-8 rounded flex-shrink-0 overflow-hidden" style={{ background: 'hsl(44 15% 84%)' }}>
                        {book.coverUrl
                          ? <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
                          : <div className="h-full w-full flex items-center justify-center text-sm">📖</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{book.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0"
                        style={{ background: 'hsl(126 15% 28%)', color: 'white' }}>+ הוסף</span>
                    </button>
                  ))}
                </div>
              )}

              {addedBook && (
                <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-6">
                  <p className="text-4xl mb-2">🎉</p>
                  <p className="font-bold" style={{ color: 'hsl(126 15% 28%)' }}>מעולה! הספר נוסף לספרייה שלך</p>
                  <p className="text-xs text-muted-foreground mt-1">מעביר אותך לאפליקציה…</p>
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <div className="px-5 pb-10 pt-3 flex items-center gap-3 max-w-sm mx-auto w-full flex-shrink-0">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            className="h-11 px-4 rounded-xl text-sm font-medium text-muted-foreground"
            style={{ background: 'hsl(44 15% 84%)' }}>
            חזרה
          </button>
        )}
        <div className="flex-1" />

        {step < 3 && (
          <>
            {step >= 2 && (
              <button onClick={() => setStep(s => s + 1)}
                className="text-sm px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
                דלג
              </button>
            )}
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && !name.trim()}
              className="h-11 px-8 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-40 transition-all"
              style={{ background: 'hsl(126 15% 28%)', color: 'white' }}
            >
              הבא <ArrowLeft size={15} />
            </button>
          </>
        )}

        {step === 3 && !addedBook && (
          <button onClick={handleFinish} disabled={saving}
            className="h-11 px-8 rounded-xl text-sm font-semibold"
            style={{ background: 'hsl(126 15% 28%)', color: 'white' }}>
            {saving ? 'שומר…' : 'סיים 🎯'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
