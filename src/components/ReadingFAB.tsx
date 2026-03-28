import { useState, useEffect, useCallback } from "react";
import { Play, Pause, Square, BookOpen, Clock, FileText, X } from "lucide-react";
import { useBooks } from "@/hooks/useBooks";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AuthGateModal from "./AuthGateModal";

type TimerState = 'idle' | 'select' | 'running' | 'paused' | 'confirm' | 'done';

const ReadingFAB = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<TimerState>('idle');
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [seconds, setSeconds] = useState(0);
  const [manualMode, setManualMode] = useState(false);
  const [manualMinutes, setManualMinutes] = useState('');
  const [currentPageInput, setCurrentPageInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  const { books } = useBooks();
  const currentBooks = books;
  const selectedBook = currentBooks.find(b => b.id === selectedBookId);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state === 'running') {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [state]);

  const formatTime = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }, []);

  const handleFinish = async () => {
    if (!selectedBookId) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const minutesRead = manualMode
        ? parseInt(manualMinutes || '0', 10)
        : Math.max(1, Math.floor(seconds / 60)); // at least 1 min so short sessions still save

      // currentPageInput = absolute page the user is on now (both confirm and manual modes)
      const newCurrentPage = parseInt(currentPageInput || '0', 10);
      const pagesRead = (newCurrentPage > 0 && selectedBook)
        ? Math.max(0, newCurrentPage - selectedBook.currentPage)
        : 0;

      if (minutesRead === 0 && pagesRead === 0 && newCurrentPage === 0) {
        toast.error("יש להזין לפחות דקות או עמוד נוכחי");
        setSaving(false);
        return;
      }

      const today = new Date();
      const sessionDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const { error } = await supabase.from("reading_sessions").insert({
        user_id: user.id,
        book_id: selectedBookId,
        minutes_read: minutesRead,
        pages_read: pagesRead,
        session_date: sessionDate,
      });

      if (error) throw error;

      // Update current page and auto-promote 'want' → 'reading'
      const bookUpdates: Record<string, unknown> = {};
      if (newCurrentPage > 0) bookUpdates.current_page = newCurrentPage;
      if (selectedBook?.status === 'want') bookUpdates.status = 'reading';
      if (Object.keys(bookUpdates).length > 0) {
        await supabase.from("books").update(bookUpdates).eq("id", selectedBookId);
      }

      setState('done');
    } catch (error: any) {
      toast.error(error.message || "שגיאה בשמירת הפעילות");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setState('idle');
    setSeconds(0);
    setSelectedBookId('');
    setManualMode(false);
    setManualMinutes('');
    setCurrentPageInput('');
  };

  return (
    <>
      <AuthGateModal open={gateOpen} onClose={() => setGateOpen(false)} action="לרשום קריאה" />

      {state === 'idle' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
          className="fixed left-0 right-0 z-50 pointer-events-none"
        >
          <div className="mx-auto max-w-md flex justify-center">
            <div className="h-16 w-16 rounded-full bg-card shadow-[0_-4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center pointer-events-auto">
              <button
                type="button"
                onClick={() => user ? setState('select') : setGateOpen(true)}
                className="h-12 w-12 rounded-full reading-gradient flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
                aria-label="התחל סשן קריאה"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 150" width="26" height="26" fill="currentColor" className="text-primary-foreground">
                  <path d="M170,10 L130,10 C115,10 100,18 90,30 C80,18 65,10 50,10 L10,10 C5,10 2,13 2,18 L2,128 C2,133 5,136 10,136 L55,136 C67,136 78,141 86,150 L90,154 L94,150 C102,141 113,136 125,136 L170,136 C175,136 178,133 178,128 L178,18 C178,13 175,10 170,10 Z M82,130 C74,124 64,120 55,120 L18,120 L18,26 L50,26 C62,26 74,31 82,40 L82,130 Z M162,120 L125,120 C116,120 106,124 98,130 L98,40 C106,31 118,26 130,26 L162,26 L162,120 Z"/>
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {state !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-end justify-center"
            onClick={(e) => e.target === e.currentTarget && handleClose()}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md rounded-t-3xl bg-card p-6 pb-8 relative"
            >
              <button
                onClick={handleClose}
                className="absolute top-4 left-4 h-8 w-8 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>

              {state === 'select' && (
                <div>
                  <h2 className="font-serif text-xl font-bold mb-4 text-center">התחל קריאה</h2>

                  {!manualMode ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-3 text-center">בחר ספר מהרשימה שלך</p>
                      {currentBooks.length === 0 ? (
                        <div className="text-center py-6">
                          <p className="text-muted-foreground text-sm">אין ספרים ברשימה</p>
                          <p className="text-xs text-muted-foreground mt-1">הוסף ספר ברשימת הספרים כדי להתחיל</p>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                            {currentBooks.map(book => (
                              <button
                                key={book.id}
                                onClick={() => setSelectedBookId(book.id)}
                                className={`w-full flex items-center gap-3 rounded-xl p-3 transition-all ${
                                  selectedBookId === book.id
                                    ? 'bg-primary/10 ring-2 ring-primary'
                                    : 'bg-muted hover:bg-accent'
                                }`}
                              >
                                <BookOpen size={18} className="text-primary flex-shrink-0" />
                                <div className="text-right flex-1">
                                  <p className="font-serif font-semibold text-sm">{book.title}</p>
                                  <p className="text-xs text-muted-foreground">{book.author}</p>
                                </div>
                                {book.status === 'want' && (
                                  <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                                    רוצה לקרוא
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => {
                              if (selectedBookId) {
                                setState('running');
                              }
                            }}
                            disabled={!selectedBookId}
                            className="w-full py-3 rounded-xl reading-gradient text-primary-foreground font-semibold text-lg disabled:opacity-40 transition-opacity"
                          >
                            התחל טיימר
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => setManualMode(true)}
                        className="w-full mt-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        הזן ידנית
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-3 text-center">הזנה ידנית</p>
                      {currentBooks.length === 0 ? (
                        <div className="text-center py-6 space-y-3">
                          <div>
                            <p className="text-muted-foreground text-sm">אין ספרים ברשימה</p>
                            <p className="text-xs text-muted-foreground mt-1">הוסף ספר ברשימת הספרים כדי להתחיל</p>
                          </div>
                          <button
                            onClick={() => {
                              handleClose();
                              navigate("/books");
                            }}
                            className="inline-flex items-center justify-center rounded-full border border-primary/40 px-4 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
                          >
                            הוסף ספר ידנית
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2 mb-3">
                            {currentBooks.map(book => (
                              <button
                                key={book.id}
                                onClick={() => setSelectedBookId(book.id)}
                                className={`w-full flex items-center gap-3 rounded-xl p-3 transition-all ${
                                  selectedBookId === book.id
                                    ? 'bg-primary/10 ring-2 ring-primary'
                                    : 'bg-muted hover:bg-accent'
                                }`}
                              >
                                <BookOpen size={18} className="text-primary flex-shrink-0" />
                                <span className="font-serif font-semibold text-sm flex-1 text-right">{book.title}</span>
                                {book.status === 'want' && (
                                  <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                                    רוצה לקרוא
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">
                                <Clock size={12} className="inline ml-1" />דקות
                              </label>
                              <input
                                type="number"
                                value={manualMinutes}
                                onChange={e => setManualMinutes(e.target.value)}
                                placeholder="30"
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">
                                <FileText size={12} className="inline ml-1" />
                                עמוד נוכחי
                                {(() => { const b = currentBooks.find(b => b.id === selectedBookId); return b?.totalPages ? ` / ${b.totalPages}` : ''; })()}
                              </label>
                              <input
                                type="number"
                                value={currentPageInput}
                                onChange={e => setCurrentPageInput(e.target.value)}
                                placeholder={(() => { const b = currentBooks.find(b => b.id === selectedBookId); return b?.currentPage ? String(b.currentPage) : '0'; })()}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                              />
                            </div>
                          </div>
                          <button
                            onClick={handleFinish}
                            disabled={!selectedBookId || (!manualMinutes && !currentPageInput) || saving}
                            className="w-full py-3 rounded-xl reading-gradient text-primary-foreground font-semibold disabled:opacity-40"
                          >
                            {saving ? "שומר..." : "שמור"}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setManualMode(false)}
                        className="w-full mt-2 py-2 text-sm text-muted-foreground"
                      >
                        חזרה לטיימר
                      </button>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="w-full mt-1 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        סגור בלי לשמור
                      </button>
                    </>
                  )}
                </div>
              )}

              {(state === 'running' || state === 'paused') && selectedBook && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">קורא עכשיו</p>
                  <h3 className="font-serif text-lg font-bold mb-6">{selectedBook.title}</h3>

                  <div className="relative mx-auto mb-8 h-40 w-40">
                    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                      <circle
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - Math.min(seconds / 3600, 1))}`}
                        className="transition-all"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-3xl font-bold font-mono tracking-wider ${state === 'paused' ? 'animate-pulse-soft' : ''}`}>
                        {formatTime(seconds)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setState(state === 'running' ? 'paused' : 'running')}
                      className="h-14 w-14 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
                    >
                      {state === 'running' ? <Pause size={24} /> : <Play size={24} />}
                    </button>
                    <button
                      onClick={() => { setState('confirm'); }}
                      disabled={saving}
                      className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center disabled:opacity-40"
                    >
                      <Square size={20} className="text-secondary-foreground" fill="currentColor" />
                    </button>
                  </div>
                </div>
              )}

              {state === 'confirm' && (
                <div>
                  <h2 className="font-serif text-xl font-bold mb-1 text-center">סיימת לקרוא!</h2>
                  <p className="text-center text-muted-foreground text-sm mb-5">
                    קראת {formatTime(seconds)} • {selectedBook?.title}
                  </p>
                  <div className="space-y-3 mb-5">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        <FileText size={12} className="inline ml-1" />
                        עמוד נוכחי
                        {selectedBook?.totalPages ? ` / ${selectedBook.totalPages}` : ''}
                        {selectedBook?.currentPage ? ` (היה: ${selectedBook.currentPage})` : ''}
                      </label>
                      <input
                        type="number"
                        value={currentPageInput}
                        onChange={e => setCurrentPageInput(e.target.value)}
                        placeholder={selectedBook?.currentPage ? String(selectedBook.currentPage) : "0"}
                        min="0"
                        max={selectedBook?.totalPages || undefined}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-right"
                        autoFocus
                      />
                      {/* Progress bar */}
                      {selectedBook?.totalPages && currentPageInput && (
                        <div className="mt-2 space-y-0.5">
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full reading-gradient transition-all"
                              style={{ width: `${Math.min(100, Math.round(parseInt(currentPageInput) / selectedBook.totalPages * 100))}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground text-left">
                            {Math.min(100, Math.round(parseInt(currentPageInput) / selectedBook.totalPages * 100))}% מהספר
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleFinish}
                    disabled={saving}
                    className="w-full py-3 rounded-xl reading-gradient text-primary-foreground font-semibold disabled:opacity-40"
                  >
                    {saving ? "שומר..." : "שמור קריאה"}
                  </button>
                  <button
                    onClick={() => setState('running')}
                    className="w-full mt-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    חזור לטיימר
                  </button>
                </div>
              )}

              {state === 'done' && (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10 }}
                    className="text-5xl mb-4"
                  >
                    🎉
                  </motion.div>
                  <h2 className="font-serif text-xl font-bold mb-2">כל הכבוד!</h2>
                  <p className="text-muted-foreground mb-6">
                    {manualMode
                      ? `קראת ${manualMinutes || 0} דקות${currentPageInput ? ` • עמוד ${currentPageInput}` : ''}`
                      : `קראת ${Math.floor(seconds / 60)} דקות${currentPageInput ? ` • עמוד ${currentPageInput}` : ''}`
                    }
                  </p>

                  <button
                    onClick={handleClose}
                    className="w-full py-3 rounded-xl reading-gradient text-primary-foreground font-semibold"
                  >
                    סגור
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ReadingFAB;
