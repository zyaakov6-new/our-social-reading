/**
 * ProGate – wraps any feature that requires Pro.
 *
 * Usage:
 *   <ProGate>
 *     <SomeProFeature />
 *   </ProGate>
 *
 * When the user is not Pro, renders a blurred placeholder with an
 * "Upgrade to Pro" button that opens the UpgradeModal.
 */
import { useState, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import UpgradeModal from "@/components/UpgradeModal";

interface ProGateProps {
  children: ReactNode;
  /** Custom title shown on the lock overlay (falls back to i18n key) */
  title?: string;
  /** Custom description shown on the lock overlay */
  desc?: string;
}

const ProGate = ({ children, title, desc }: ProGateProps) => {
  const { isPro, isLoading } = useSubscription();
  const { t } = useLanguage();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Still loading — render nothing to avoid layout flash
  if (isLoading) return null;

  // User has Pro — render children as-is
  if (isPro) return <>{children}</>;

  return (
    <>
      <div className="relative rounded-xl overflow-hidden">
        {/* Blurred preview of the actual content */}
        <div className="pointer-events-none select-none blur-[3px] opacity-60">
          {children}
        </div>

        {/* Lock overlay */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl"
          style={{ background: "hsl(44 27% 84% / 0.80)", backdropFilter: "blur(2px)" }}
        >
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center"
            style={{ background: "hsl(126 15% 28%)" }}
          >
            <Lock size={18} className="text-white" />
          </div>
          <div className="text-center px-4">
            <p className="font-bold text-sm text-foreground">
              {title ?? t.subscription.gateTitle}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {desc ?? t.subscription.gateDesc}
            </p>
          </div>
          <Button
            size="sm"
            className="h-8 text-xs font-bold rounded-full px-4"
            style={{
              background: "hsl(126 15% 28%)",
              color: "hsl(44 30% 93%)",
            }}
            onClick={() => setUpgradeOpen(true)}
          >
            {t.subscription.upgradeCta}
          </Button>
        </div>
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
};

export default ProGate;
