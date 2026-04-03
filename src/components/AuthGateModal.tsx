import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface AuthGateModalProps {
  open: boolean;
  onClose: () => void;
  /** Short phrase describing the blocked action, e.g. "לרשום קריאה" */
  action?: string;
}

const AuthGateModal = ({ open, onClose, action }: AuthGateModalProps) => {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();

  const goSignup = () => { onClose(); navigate("/auth"); };
  const goLogin  = () => { onClose(); navigate("/auth"); };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent dir={dir} className="max-w-xs rounded-2xl p-0 overflow-hidden">
        {/* Top accent bar */}
        <div style={{ height: 4, background: 'linear-gradient(to left, hsl(28 71% 57%), hsl(126 15% 28%))' }} />

        <div className="px-6 pb-7 pt-5 text-center space-y-5">
          {/* Icon */}
          <div
            className="w-14 h-14 rounded-full mx-auto flex items-center justify-center"
            style={{ background: 'hsl(126 15% 28% / 0.10)' }}
          >
            <BookOpen size={26} strokeWidth={1.5} style={{ color: 'hsl(126 15% 28%)' }} />
          </div>

          {/* Copy */}
          <div className="space-y-1.5">
            <h2 className="font-serif text-[1.15rem] font-bold leading-snug">
              {action ? `${t.auth_gate.toContinue} ${action}` : t.auth_gate.toContinue}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.auth_gate.joinAmud}
            </p>
          </div>

          {/* CTAs */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={goSignup}
              className="w-full py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
              style={{ background: 'hsl(126 15% 28%)', color: 'hsl(44 30% 93%)' }}
            >
              {t.auth_gate.joinFree}
            </button>
            <button
              onClick={goLogin}
              className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.auth_gate.alreadyRegistered}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthGateModal;
