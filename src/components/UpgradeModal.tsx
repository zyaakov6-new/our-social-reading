import { useState, useEffect } from "react";
import { Sparkles, Flame, BarChart2, Trophy, Mail, X } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackEvent } from "@/lib/analytics";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const PRO_FEATURES = [
  { icon: Sparkles,  key: "feat1" as const },
  { icon: Trophy,    key: "feat2" as const },
  { icon: BarChart2, key: "feat3" as const },
  { icon: Mail,      key: "feat4" as const },
  { icon: Flame,     key: "feat5" as const },
] as const;

const UpgradeModal = ({ open, onClose }: UpgradeModalProps) => {
  const { openCheckout } = useSubscription();
  const { t, dir } = useLanguage();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');

  useEffect(() => {
    if (open) trackEvent("upgrade_modal_opened");
  }, [open]);

  const handleUpgrade = () => {
    trackEvent("upgrade_checkout_clicked", { billing });
    const opened = openCheckout(billing);
    if (opened) onClose();
  };

  const isYearly = billing === 'yearly';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        dir={dir}
        className="max-w-sm p-0 overflow-hidden rounded-2xl gap-0"
        hideClose
      >
        {/* Header */}
        <div
          className="relative px-6 pt-6 pb-5 text-center"
          style={{
            background: "linear-gradient(135deg, hsl(126 15% 22%) 0%, hsl(126 15% 32%) 100%)",
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-3 end-3 p-1 rounded-full text-white/60 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>

          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest mb-3"
            style={{ background: "hsl(44 70% 55%)", color: "hsl(126 15% 15%)" }}
          >
            PRO
          </div>
          <h2 className="text-xl font-bold text-white leading-tight mb-1">
            {t.subscription.modalTitle}
          </h2>
          <p className="text-white/70 text-sm">{t.subscription.modalSubtitle}</p>

          {/* Monthly / Yearly toggle */}
          <div
            className="mt-4 inline-flex rounded-full p-1 gap-1"
            style={{ background: "hsl(126 15% 15% / 0.5)" }}
          >
            {(['monthly', 'yearly'] as const).map((plan) => (
              <button
                key={plan}
                onClick={() => setBilling(plan)}
                className="rounded-full px-4 py-1.5 text-xs font-bold transition-all"
                style={
                  billing === plan
                    ? { background: "hsl(44 70% 55%)", color: "hsl(126 15% 15%)" }
                    : { color: "hsl(44 30% 75%)" }
                }
              >
                {plan === 'monthly'
                  ? (dir === 'rtl' ? 'חודשי' : 'Monthly')
                  : (dir === 'rtl' ? 'שנתי' : 'Yearly')}
                {plan === 'yearly' && (
                  <span className="ms-1.5 text-[9px] font-extrabold opacity-80">
                    {t.subscription.yearlyNote}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Price */}
          <div className="mt-4 flex items-end justify-center gap-1">
            <span className="text-4xl font-extrabold text-white leading-none">
              {isYearly ? t.subscription.yearlyPrice.split(' ')[0] : t.subscription.price}
            </span>
            <span className="text-white/70 text-sm mb-1">
              {isYearly
                ? t.subscription.yearlyPrice.split(' ').slice(1).join(' ')
                : t.subscription.perMonth}
            </span>
          </div>
          <p className="text-white/50 text-[11px] mt-0.5">
            {isYearly ? t.subscription.yearlyNote : t.subscription.monthlyNote}
          </p>
        </div>

        {/* Features */}
        <div className="px-6 py-5 space-y-3 bg-card">
          {PRO_FEATURES.map(({ icon: Icon, key }) => (
            <div key={key} className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(126 15% 28% / 0.12)" }}
              >
                <Icon size={15} style={{ color: "hsl(126 15% 28%)" }} />
              </div>
              <span className="text-sm font-medium text-foreground">
                {t.subscription[key]}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 bg-card">
          <Button
            className="w-full h-12 text-base font-bold rounded-xl"
            style={{
              background: "linear-gradient(135deg, hsl(126 15% 28%) 0%, hsl(126 22% 38%) 100%)",
              color: "hsl(44 30% 93%)",
            }}
            onClick={handleUpgrade}
          >
            {t.subscription.upgradeCta}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground mt-2">
            {t.subscription.cancelAnytime}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
