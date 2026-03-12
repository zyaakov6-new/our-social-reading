import { useState, useEffect, useCallback } from "react";
import { Play, Pause, Square, BookOpen, Clock, FileText } from "lucide-react";
import { mockBooks } from "@/lib/mockData";
import { motion, AnimatePresence } from "framer-motion";

type TimerState = 'idle' | 'select' | 'running' | 'paused' | 'done';

const ReadingFAB = () => {
  const [state, setState] = useState<TimerState>('idle');
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [seconds, setSeconds] = useState(0);
  const [manualMode, setManualMode] = useState(false);
  const [manualMinutes, setManualMinutes] = useState('');
  const [manualPages, setManualPages] = useState('');

  const currentBooks = mockBooks.filter(b => b.status === 'reading');
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

  const handleFinish = () => {
    setState('done');
  };

  const handleClose = () => {
    setState('idle');
    setSeconds(0);
    setSelectedBookId('');
    setManualMode(false);
    setManualMinutes('');
    setManualPages('');
  };

  return (
    <>
      {/* FAB */}
      {state === 'idle' && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setState('select')}
          className="fixed bottom-20 left-4 z-50 h-14 w-14 rounded-full reading-gradient flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
        >
          <Play size={24} className="text-primary-foreground mr-[-2px]" fill="currentColor" />
        </motion.button>
      )}

      {/* Modal Overlay */}
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
              className="w-full max-w-md rounded-t-3xl bg-card p-6 pb-8"
            >
              {/* Select Book */}
              {state === 'select' && (
                <div>
                  <h2 className="font-serif text-xl font-bold mb-4 text-center">התחל קריאה</h2>

                  {!manualMode ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-3 text-center">בחר ספר מהרשימה שלך</p>
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
                        ▶ התחל טיימר
                      </button>

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
                            <span className="font-serif font-semibold text-sm">{book.title}</span>
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
                            <FileText size={12} className="inline ml-1" />עמודים
                          </label>
                          <input
                            type="number"
                            value={manualPages}
                            onChange={e => setManualPages(e.target.value)}
                            placeholder="20"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (selectedBookId && (manualMinutes || manualPages)) {
                            setState('done');
                          }
                        }}
                        disabled={!selectedBookId || (!manualMinutes && !manualPages)}
                        className="w-full py-3 rounded-xl reading-gradient text-primary-foreground font-semibold disabled:opacity-40"
                      >
                        שמור
                      </button>
                      <button
                        onClick={() => setManualMode(false)}
                        className="w-full mt-2 py-2 text-sm text-muted-foreground"
                      >
                        חזרה לטיימר
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Timer Running / Paused */}
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
                      onClick={handleFinish}
                      className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center"
                    >
                      <Square size={20} className="text-secondary-foreground" fill="currentColor" />
                    </button>
                  </div>
                </div>
              )}

              {/* Done */}
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
                      ? `קראת ${manualMinutes || 0} דקות • ${manualPages || 0} עמודים`
                      : `קראת ${Math.floor(seconds / 60)} דקות`
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
