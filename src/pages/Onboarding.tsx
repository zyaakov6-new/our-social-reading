import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { searchBooks, BookSearchResult } from "@/services/googleBooks";
import { Search, ArrowLeft, Flame, Trophy, Bell } from "lucide-react";

const C = {
  green:  'hsl(126 15% 28%)',
  teal:   'hsl(188 60% 35%)',
  orange: 'hsl(28 71% 57%)',
  muted:  'hsl(44 12% 55%)',
  bg:     'hsl(44 27% 93%)',
};

const MINUTE_OPTIONS = [15, 30, 45, 60];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Step 0 — book
  const [bookQuery, setBookQuery] = useState('');
  const [bookResults, setBookResults] = useState<BookSearchResult[]>([]);
  const [searchingBooks, setSearchingBooks] = useState(false);
  const [addedBook, setAddedBook] = useState<BookSearchResult | null>(null);
  const [addedBookId, setAddedBookId] = useState<string | null>(null);
  const bookDebounce = useRef<ReturnType<typeof setTimeout>>();

  // Step 1 — name
  const [name, setName] = useState('');

  // Step 2 — first session
  const [minutes, setMinutes] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState('');
  const [savingSession, setSavingSession] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);

  // Step 3 — push notifications
  const [pushStep, setPushStep] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  // Pre-fill name from Google/existing profile
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('display_name').eq('user_id', user.id).maybeSingle();
      const prefilled = profile?.display_name || user.user_metadata?.full_name || '';
      if (prefilled) setName(prefilled);
    };
    init();
  }, []);

  // Book search debounce
  useEffect(() => {
    if (!bookQuery.trim() || bookQuery.trim().length < 2) { setBookResults([]); return; }
    clearTimeout(bookDebounce.current);
    bookDebounce.current = setTimeout(async () => {
      setSearchingBooks(true);
      try { setBookResults((await searchBooks(bookQuery)).slice(0, 5)); }
      finally { setSearchingBooks(false); }
    }, 400);
    return () => clearTimeout(bookDebounce.current);
  }, [bookQuery]);

  const handleAddBook = async (book: BookSearchResult) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('books').insert({
      user_id: user.id, title: book.title, author: book.author,
      total_pages: book.totalPages, cover_url: book.coverUrl,
      current_page: 0, status: 'reading',
    }).select('id').single();
    window.dispatchEvent(new CustomEvent('bookAdded'));
    setAddedBook(book);
    setAddedBookId(data?.id ?? null);
    setTimeout(() => setStep(1), 800);
  };

  const handleSaveSession = async () => {
    const mins = minutes ?? parseInt(customMinutes || '0', 10);
    if (!mins || mins <= 0) { setStep(1); return; }

    setSavingSession(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const today = new Date();
      const sessionDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      await supabase.from('reading_sessions').insert({
        user_id: user.id,
        book_id: addedBookId,   // null is fine if no book was added
        minutes_read: mins,
        pages_read: 0,
        session_date: sessionDate,
      });
    }
    setSavingSession(false);
    setSessionSaved(true);
    // After celebration, move to push notifications step
    setTimeout(() => setPushStep(true), 2200);
  };

  const handleRequestPush = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      handleFinish();
      return;
    }
    setPushLoading(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        const reg = await navigator.serviceWorker.ready;
        const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ??
          'BBu5lR72P2GEB8K0qDtgo-h2EHVHAiemxoYHMPniiOeI2ODlyxlkVtiMOTAYfYaxRz71h5oYZNFbdgWiNF0ZRqU';
        const padding = '='.repeat((4 - (VAPID_PUBLIC_KEY.length % 4)) % 4);
        const base64 = (VAPID_PUBLIC_KEY + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = atob(base64);
        const applicationServerKey = Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
        const existing = await reg.pushManager.getSubscription();
        const sub = existing ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
        const subJson = sub.toJSON();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('push_subscriptions').upsert({
            user_id: user.id,
            endpoint: sub.endpoint,
            p256dh: subJson.keys?.p256dh ?? '',
            auth: subJson.keys?.auth ?? '',
          }, { onConflict: 'user_id' });
          localStorage.setItem('push-subscribed', '1');
        }
      }
    } catch (e) {
      console.warn('Push subscribe failed:', e);
    }
    setPushLoading(false);
    handleFinish();
  };

  const handleFinish = async () => {
    setSaving(true);
    localStorage.setItem('onboarding_complete', 'true');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await Promise.all([
          supabase.auth.updateUser({ data: { full_name: name.trim() || undefined, onboarding_complete: true } }),
          supabase.from('profiles').upsert({
            user_id: user.id,
            display_name: name.trim() || null,
          }, { onConflict: 'user_id' }),
        ]);
      }
    } catch (e) { console.warn('Onboarding save failed:', e); }
    navigate('/', { replace: true });
  };

  const selectedMinutes = minutes ?? (customMinutes ? parseInt(customMinutes) : null);

  return (
    <div dir="rtl" className="min-h-screen flex flex-col" style={{ background: C.bg }}>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-8 pb-2 flex-shrink-0">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-1.5 rounded-full transition-all duration-300"
            style={{ width: i === step ? 28 : 8, background: i <= step ? C.green : 'hsl(44 15% 75%)' }} />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        <AnimatePresence mode="wait">

          {/* ── Push notifications step (after session saved) ────── */}
          {pushStep && (
            <motion.div key="push"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col pt-10 pb-4 gap-6 max-w-sm mx-auto text-center"
            >
              <div className="space-y-2">
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto"
                  style={{ background: 'hsl(28 71% 57% / 0.12)' }}>
                  <Bell size={32} style={{ color: C.orange }} />
                </div>
                <h2 className="font-serif text-xl font-bold">לא לשבור את הרצף 🔥</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  נשלח לך תזכורת ב-22:00 בכל יום שלא קראת — כדי שתשמור על הרצף שלך
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleRequestPush}
                  disabled={pushLoading}
                  className="w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-60"
                  style={{ background: C.green, color: 'white' }}
                >
                  {pushLoading ? 'מפעיל...' : 'הפעל תזכורות יומיות ←'}
                </button>
                <button
                  onClick={handleFinish}
                  className="w-full py-3 text-sm text-muted-foreground"
                >
                  לא עכשיו
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 0: Add first book ───────────────────────────── */}
          {!pushStep && step === 0 && (
            <motion.div key="book"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col pt-6 pb-4 gap-4 max-w-sm mx-auto"
            >
              <div className="text-center space-y-1">
                <p className="text-3xl">📖</p>
                <h2 className="font-serif text-xl font-bold">איזה ספר אתה קורא עכשיו?</h2>
                <p className="text-xs text-muted-foreground">חפש ספר - נתחיל לעקוב אחרי ההתקדמות שלך</p>
              </div>

              {!addedBook ? (
                <>
                  <div className="relative">
                    <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      value={bookQuery} onChange={e => setBookQuery(e.target.value)}
                      placeholder="שם הספר או המחבר..." dir="rtl" autoFocus
                      className="w-full text-sm rounded-xl pr-9 pl-4 py-3 outline-none"
                      style={{ background: 'hsl(44 25% 97%)', border: '1.5px solid hsl(44 15% 80%)' }}
                      onFocus={e => (e.currentTarget.style.borderColor = C.green)}
                      onBlur={e => (e.currentTarget.style.borderColor = 'hsl(44 15% 80%)')}
                    />
                    {searchingBooks && (
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 animate-spin"
                        style={{ borderColor: 'hsl(126 15% 28% / 0.25)', borderTopColor: C.green }} />
                    )}
                  </div>

                  {bookResults.length > 0 && (
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(44 15% 80%)' }}>
                      {bookResults.map(book => (
                        <button key={book.googleBooksId} onClick={() => handleAddBook(book)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-right transition-colors active:scale-[0.99]"
                          style={{ background: 'hsl(44 25% 97%)', borderBottom: '1px solid hsl(44 15% 84%)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'hsl(44 20% 91%)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'hsl(44 25% 97%)')}
                        >
                          <div className="h-12 w-8 rounded flex-shrink-0 overflow-hidden" style={{ background: 'hsl(44 15% 84%)' }}>
                            {book.coverUrl
                              ? <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
                              : <div className="h-full w-full flex items-center justify-center text-sm">📖</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{book.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0 text-white"
                            style={{ background: C.green }}>+ הוסף</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-6 space-y-2">
                  <p className="text-4xl">✅</p>
                  <p className="font-bold" style={{ color: C.green }}>{addedBook.title} נוסף!</p>
                  <p className="text-xs text-muted-foreground">ממשיכים…</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Step 1: Name ─────────────────────────────────────── */}
          {!pushStep && step === 1 && (
            <motion.div key="name"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col pt-6 pb-4 gap-5 max-w-sm mx-auto"
            >
              <div className="text-center space-y-1">
                <p className="text-3xl">👋</p>
                <h2 className="font-serif text-xl font-bold">מה קוראים לך?</h2>
                <p className="text-xs text-muted-foreground">השם שיופיע בלוח התוצאות</p>
              </div>

              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="השם שלך" dir="rtl" autoFocus
                className="w-full text-sm rounded-xl px-4 py-3 outline-none"
                style={{ background: 'hsl(44 25% 97%)', border: '1.5px solid hsl(44 15% 80%)' }}
                onFocus={e => (e.currentTarget.style.borderColor = C.green)}
                onBlur={e => (e.currentTarget.style.borderColor = 'hsl(44 15% 80%)')}
                onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(2)}
              />

              {/* Mini leaderboard preview with their name */}
              <div className="rounded-2xl overflow-hidden text-sm"
                style={{ border: '1px solid hsl(44 15% 80%)', background: 'hsl(44 30% 96%)' }}>
                <div className="px-3 py-2 text-xs font-bold flex items-center gap-1.5"
                  style={{ borderBottom: '1px solid hsl(44 15% 80%)', color: C.green }}>
                  <Trophy size={12} /> כך ייראה הדירוג שלך
                </div>
                {[
                  { name: 'יעל כ׳', mins: 147, rank: 1 },
                  { name: 'דני ל׳', mins: 93,  rank: 2 },
                  { name: name.trim() || 'אתה', mins: 0, rank: 3, isYou: true },
                ].map(r => (
                  <div key={r.rank} className="flex items-center gap-2.5 px-3 py-2"
                    style={{ borderBottom: '1px solid hsl(44 15% 84%)', background: r.isYou ? `${C.green}0d` : undefined }}>
                    <span className="text-xs w-4 text-center text-muted-foreground">{r.rank}</span>
                    <span className={`flex-1 text-xs font-semibold ${r.isYou ? 'text-primary' : ''}`}
                      style={r.isYou ? { color: C.green } : {}}>
                      {r.name}{r.isYou && ' ← אתה'}
                    </span>
                    <span className="text-xs font-bold" style={{ color: r.mins > 0 ? C.teal : C.muted }}>
                      {r.mins > 0 ? `${r.mins} דק׳` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Step 2: First reading session ────────────────────── */}
          {!pushStep && step === 2 && (
            <motion.div key="session"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col pt-6 pb-4 gap-5 max-w-sm mx-auto"
            >
              {!sessionSaved ? (
                <>
                  <div className="text-center space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <Flame size={28} style={{ color: C.orange }} />
                      <p className="font-serif text-xl font-bold">כמה דקות קראת היום?</p>
                    </div>
                    {addedBook && (
                      <p className="text-xs text-muted-foreground">ב"{addedBook.title}"</p>
                    )}
                    <p className="text-xs text-muted-foreground">רישום ראשון = יום 1 ברצף!</p>
                  </div>

                  {/* Quick-select */}
                  <div className="grid grid-cols-4 gap-2">
                    {MINUTE_OPTIONS.map(m => (
                      <button key={m} onClick={() => { setMinutes(m); setCustomMinutes(''); }}
                        className="py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                        style={minutes === m
                          ? { background: C.green, color: 'white' }
                          : { background: 'hsl(44 25% 97%)', border: '1.5px solid hsl(44 15% 80%)', color: C.green }
                        }>
                        {m}′
                      </button>
                    ))}
                  </div>

                  {/* Custom input */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground flex-shrink-0">מספר אחר:</span>
                    <input
                      type="number" min="1" max="480"
                      value={customMinutes}
                      onChange={e => { setCustomMinutes(e.target.value); setMinutes(null); }}
                      placeholder="דקות"
                      className="w-24 text-sm rounded-xl px-3 py-2 outline-none text-center"
                      style={{ background: 'hsl(44 25% 97%)', border: '1.5px solid hsl(44 15% 80%)' }}
                      onFocus={e => (e.currentTarget.style.borderColor = C.green)}
                      onBlur={e => (e.currentTarget.style.borderColor = 'hsl(44 15% 80%)')}
                    />
                    <span className="text-xs text-muted-foreground">דקות</span>
                  </div>
                </>
              ) : (
                /* Session saved — streak + leaderboard celebration */
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10, delay: 0.1 }}>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Flame size={36} style={{ color: C.orange }} />
                      <span className="font-display text-5xl tracking-tight" style={{ color: C.orange }}>1</span>
                    </div>
                    <p className="font-serif text-lg font-bold">יום 1 ברצף! 🎉</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedMinutes} דקות קריאה נרשמו
                    </p>
                  </motion.div>

                  {/* Mini leaderboard */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-2xl overflow-hidden text-sm"
                    style={{ border: '1px solid hsl(44 15% 80%)', background: 'hsl(44 30% 96%)' }}>
                    <div className="px-3 py-2 text-xs font-bold flex items-center gap-1.5"
                      style={{ borderBottom: '1px solid hsl(44 15% 80%)', color: C.green }}>
                      <Trophy size={12} /> הדירוג השבועי שלך
                    </div>
                    {[
                      { name: 'יעל כ׳', mins: 147, rank: 1 },
                      { name: 'דני ל׳', mins: 93,  rank: 2 },
                      { name: name.trim() || 'אתה', mins: selectedMinutes ?? 0, rank: 3, isYou: true },
                    ].map(r => (
                      <div key={r.rank} className="flex items-center gap-2.5 px-3 py-2"
                        style={{ borderBottom: '1px solid hsl(44 15% 84%)', background: r.isYou ? `${C.green}0d` : undefined }}>
                        <span className="text-xs w-4 text-center text-muted-foreground">{r.rank}</span>
                        <span className={`flex-1 text-xs font-semibold`}
                          style={r.isYou ? { color: C.green } : {}}>
                          {r.name}{r.isYou && ' ← אתה'}
                        </span>
                        <span className="text-xs font-bold" style={{ color: C.teal }}>
                          {r.mins} דק׳
                        </span>
                      </div>
                    ))}
                    <div className="px-3 py-2 text-center text-[11px] font-semibold" style={{ color: C.orange }}>
                      קרא עוד {147 - (selectedMinutes ?? 0)} דקות השבוע - תנצח את יעל! 🏆
                    </div>
                  </motion.div>

                  <p className="text-xs text-muted-foreground animate-pulse">רגע אחד…</p>
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Bottom actions */}
      {!sessionSaved && !pushStep && (
        <div className="px-5 pb-10 pt-3 flex items-center gap-3 max-w-sm mx-auto w-full flex-shrink-0">
          {step > 0 && !addedBook && (
            <button onClick={() => setStep(s => s - 1)}
              className="h-11 px-4 rounded-xl text-sm font-medium text-muted-foreground touch-manipulation"
              style={{ background: 'hsl(44 15% 84%)' }}>
              חזרה
            </button>
          )}

          {/* Step 0: skip if no book */}
          {step === 0 && !addedBook && (
            <button onClick={() => setStep(1)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors touch-manipulation">
              דלג בינתיים
            </button>
          )}

          <div className="flex-1" />

          {/* Step 1: next */}
          {step === 1 && (
            <>
              {!addedBook && (
                <button onClick={() => setStep(2)}
                  className="text-sm px-3 py-2 text-muted-foreground touch-manipulation">
                  דלג
                </button>
              )}
              <button
                onClick={() => setStep(2)}
                className="h-11 px-8 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all touch-manipulation"
                style={{ background: C.green, color: 'white' }}
              >
                הבא <ArrowLeft size={15} />
              </button>
            </>
          )}

          {/* Step 2: save session or skip to finish */}
          {step === 2 && (
            <>
              <button onClick={handleFinish}
                className="text-sm px-3 py-2 text-muted-foreground touch-manipulation">
                דלג
              </button>
              <button
                onClick={handleSaveSession}
                disabled={savingSession || !selectedMinutes}
                className="h-11 px-8 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-40 transition-all touch-manipulation"
                style={{ background: C.orange, color: 'white' }}
              >
                {savingSession ? 'שומר…' : <>התחל רצף 🔥</>}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Onboarding;
