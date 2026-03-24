import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Share2, Copy, Check } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const InviteModal = ({ open, onClose }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const inviteUrl = user
    ? `${window.location.origin}/join?ref=${user.id}`
    : window.location.origin;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleWhatsApp = () => {
    const displayName =
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "חבר";
    const text = `היי! ${displayName} מזמין אותך ל-AMUD 📚 - האפליקציה שהופכת קריאה לחוויה חברתית. הצטרף כאן: ${inviteUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleNativeShare = () => {
    const displayName =
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "חבר";
    if (navigator.share) {
      navigator.share({
        title: "AMUD - קריאה חברתית",
        text: `${displayName} מזמין אותך לקרוא ביחד ב-AMUD 📚`,
        url: inviteUrl,
      });
    } else {
      handleCopy();
    }
  };

  const viewCard = () => {
    onClose();
    navigate(`/share/${user?.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent
        dir="rtl"
        className="max-w-sm"
        style={{ background: "hsl(44 22% 90%)", borderColor: "hsl(44 12% 74%)" }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-right font-bold"
            style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: "1.2rem" }}
          >
            הזמן חברים לקרוא איתך
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground text-right leading-relaxed">
          שתף קישור ייחודי עם חברים - כשהם מצטרפים, תהיו חברים אוטומטית ותופיעו בלוח הדירוגים של אחד השני.
        </p>

        {/* Invite link box */}
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2.5"
          style={{
            background: "hsl(44 15% 83%)",
            border: "1px solid hsl(44 12% 72%)",
          }}
        >
          <span className="text-xs text-muted-foreground truncate flex-1 text-left dir-ltr" style={{ direction: "ltr", fontFamily: "monospace" }}>
            {inviteUrl}
          </span>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 p-1.5 rounded-md transition-colors"
            style={{ color: copied ? "hsl(126 15% 28%)" : "hsl(210 8% 50%)" }}
            title="העתק קישור"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-2 rounded-lg py-3 font-bold text-sm text-white transition-opacity hover:opacity-90"
            style={{ background: "#25D366" }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            שלח בוואטסאפ
          </button>

          <button
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-2 rounded-lg py-3 font-bold text-sm transition-colors"
            style={{
              background: "hsl(126 15% 28%)",
              color: "hsl(44 30% 93%)",
            }}
          >
            <Share2 size={16} />
            שתף
          </button>

          <button
            onClick={viewCard}
            className="w-full rounded-lg py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            style={{ background: "transparent" }}
          >
            צפה בכרטיס ההזמנה שלי →
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteModal;
