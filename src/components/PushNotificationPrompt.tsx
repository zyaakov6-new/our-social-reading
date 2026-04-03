import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PushNotificationPrompt() {
  const { user } = useAuth();
  const { t, dir } = useLanguage();
  const { supported, permission, subscribed, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('push-prompt-dismissed') === '1'
  );
  const [loading, setLoading] = useState(false);

  const visible =
    !!user &&
    supported &&
    permission !== 'denied' &&
    !subscribed &&
    !dismissed;

  const handleSubscribe = async () => {
    setLoading(true);
    const ok = await subscribe();
    setLoading(false);
    if (ok) setDismissed(true);
  };

  const handleDismiss = () => {
    localStorage.setItem('push-prompt-dismissed', '1');
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, delay: 0.3 }}
          className="fixed bottom-24 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div
            className="rounded-2xl p-4 shadow-2xl"
            style={{
              background: 'hsl(44 30% 97%)',
              border: '1px solid hsl(44 15% 78%)',
              boxShadow: '0 8px 32px hsl(126 15% 28% / 0.15)',
            }}
          >
            <button
              onClick={handleDismiss}
              className="absolute top-3 left-3 touch-manipulation"
              style={{ background: 'none', border: 'none', color: 'hsl(44 12% 55%)' }}
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3" dir={dir}>
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'hsl(28 71% 57% / 0.12)' }}
              >
                <Bell size={22} style={{ color: 'hsl(28 71% 45%)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-snug" style={{ color: 'hsl(126 15% 22%)' }}>
                  {t.push.title}
                </p>
                <p className="text-xs mt-0.5 text-muted-foreground">
                  {t.push.subtitle}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 touch-manipulation disabled:opacity-60"
                style={{ background: 'hsl(126 15% 28%)', color: 'white' }}
              >
                {loading ? t.push.enabling : t.push.enable}
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 rounded-xl text-sm font-medium touch-manipulation"
                style={{ background: 'hsl(44 15% 85%)', color: 'hsl(44 12% 40%)' }}
              >
                {t.push.dismiss}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
