import { Download, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PWAInstallBanner() {
  const { canInstall, install, dismiss } = usePWAInstall();
  const { t, dir } = useLanguage();

  return (
    <AnimatePresence>
      {canInstall && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed bottom-24 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div
            className="rounded-2xl p-4 shadow-2xl"
            style={{ background: 'hsl(126 15% 28%)', color: 'white' }}
          >
            <button
              onClick={dismiss}
              className="absolute top-3 left-3 opacity-60 hover:opacity-100 touch-manipulation"
              style={{ background: 'none', border: 'none', color: 'white' }}
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3" dir={dir}>
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'white / 0.15' , backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <Download size={22} style={{ color: 'white' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-snug">{t.pwa.title}</p>
                <p className="text-xs mt-0.5" style={{ opacity: 0.8 }}>
                  {t.pwa.subtitle}
                </p>
              </div>
            </div>

            <button
              onClick={install}
              className="mt-3 w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 touch-manipulation"
              style={{ background: 'white', color: 'hsl(126 15% 28%)' }}
            >
              {t.pwa.install}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
