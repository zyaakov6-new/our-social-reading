import { X, Smartphone, Bell, Zap, Share } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const BENEFITS = [
  { icon: Bell,       heKey: 'benefitNotifs' as const, enKey: 'benefitNotifs' as const },
  { icon: Zap,        heKey: 'benefitSpeed'  as const, enKey: 'benefitSpeed'  as const },
  { icon: Smartphone, heKey: 'benefitHome'   as const, enKey: 'benefitHome'   as const },
];

export default function PWAInstallBanner() {
  const { canInstall, showIOS, install, snooze, dismiss } = usePWAInstall();
  const { t, dir } = useLanguage();

  const visible = canInstall || showIOS;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="fixed bottom-20 left-3 right-3 z-50 max-w-md mx-auto"
        >
          <div
            className="rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: 'hsl(44 30% 97%)',
              border: '1px solid hsl(44 15% 78%)',
              boxShadow: '0 8px 40px hsl(126 15% 15% / 0.18)',
            }}
          >
            {/* Header */}
            <div
              className="px-4 pt-4 pb-3 flex items-start gap-3"
              dir={dir}
              style={{ borderBottom: '1px solid hsl(44 15% 88%)' }}
            >
              {/* App icon */}
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ background: 'hsl(126 15% 28%)' }}
              >
                <span
                  className="font-serif font-bold text-lg tracking-widest"
                  style={{ color: 'hsl(44 30% 90%)' }}
                >
                  A
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-snug" style={{ color: 'hsl(126 15% 22%)' }}>
                  {t.pwa.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.pwa.subtitle}</p>
              </div>
              <button
                onClick={snooze}
                className="p-1 -mt-0.5 -me-0.5 rounded-full hover:bg-muted transition-colors flex-shrink-0"
                style={{ color: 'hsl(44 12% 55%)' }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Benefits */}
            <div className="px-4 py-3 space-y-2" dir={dir}>
              {BENEFITS.map(({ icon: Icon, heKey }) => (
                <div key={heKey} className="flex items-center gap-2.5">
                  <Icon size={14} style={{ color: 'hsl(126 15% 40%)', flexShrink: 0 }} />
                  <span className="text-xs text-foreground">{t.pwa[heKey]}</span>
                </div>
              ))}
            </div>

            {/* iOS instructions */}
            {showIOS && (
              <div
                className="mx-4 mb-3 rounded-xl px-3 py-2.5 space-y-1.5"
                dir={dir}
                style={{ background: 'hsl(126 15% 28% / 0.07)', border: '1px solid hsl(126 15% 28% / 0.12)' }}
              >
                <p className="text-[11px] font-bold text-foreground">{t.pwa.iosHowTo}</p>
                <div className="space-y-1">
                  {(['iosStep1', 'iosStep2', 'iosStep3'] as const).map((key, i) => (
                    <div key={key} className="flex items-center gap-2">
                      <span
                        className="h-4 w-4 rounded-full text-[9px] font-bold flex items-center justify-center flex-shrink-0"
                        style={{ background: 'hsl(126 15% 28%)', color: 'white' }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        {t.pwa[key]}
                        {key === 'iosStep1' && (
                          <Share size={11} className="inline-block" style={{ color: 'hsl(211 100% 50%)' }} />
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="px-4 pb-4 flex gap-2" dir={dir}>
              {canInstall && (
                <button
                  onClick={install}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 touch-manipulation"
                  style={{ background: 'hsl(126 15% 28%)', color: 'white' }}
                >
                  {t.pwa.install}
                </button>
              )}
              <button
                onClick={dismiss}
                className="px-3 py-2.5 rounded-xl text-xs font-medium touch-manipulation transition-colors hover:bg-muted"
                style={{ color: 'hsl(44 12% 50%)' }}
              >
                {t.pwa.neverShow}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
