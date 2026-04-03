import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackEvent } from "@/lib/analytics";
import { buildAuthPath, storeAuthIntent } from "@/lib/auth-flow";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

interface AuthGateModalProps {
  open: boolean;
  onClose: () => void;
  action?: string;
  nextPath?: string | null;
  source?: string;
  variant?: string;
}

const AuthGateModal = ({
  open,
  onClose,
  action,
  nextPath = "/",
  source = "gate",
  variant = "unknown",
}: AuthGateModalProps) => {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();

  const goToAuth = (mode: "signup" | "login") => {
    storeAuthIntent({
      source,
      variant,
      mode,
      next: nextPath,
      action,
    });

    trackEvent("auth_gate_clicked", {
      source,
      variant,
      mode,
      action: action ?? "none",
      next: nextPath,
    });

    onClose();
    navigate(
      buildAuthPath(mode, {
        next: nextPath,
        source,
        variant,
        action,
      }),
    );
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent dir={dir} className="max-w-sm overflow-hidden rounded-2xl p-0">
        <div
          className="h-1"
          style={{
            background:
              "linear-gradient(to left, hsl(28 71% 57%), hsl(126 15% 28%))",
          }}
        />

        <div className="space-y-5 px-6 pb-7 pt-6 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "hsl(126 15% 28% / 0.10)" }}
          >
            <BookOpen size={26} strokeWidth={1.5} style={{ color: "hsl(126 15% 28%)" }} />
          </div>

          <div className="space-y-2">
            <DialogTitle className="font-serif text-[1.15rem] font-bold leading-snug">
              {action ? `${t.auth_gate.toContinue} ${action}` : t.auth_gate.toContinue}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              {t.auth_gate.joinAmud}
            </DialogDescription>
          </div>

          <div className="space-y-2.5 pt-1">
            <Button
              type="button"
              className="w-full rounded-xl bg-[hsl(126_15%_28%)] py-3 text-sm font-bold text-[hsl(44_30%_93%)] hover:bg-[hsl(126_15%_24%)]"
              onClick={() => goToAuth("signup")}
            >
              {t.auth_gate.joinFree}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={() => goToAuth("login")}
            >
              {t.auth_gate.alreadyRegistered}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthGateModal;
