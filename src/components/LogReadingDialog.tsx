import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Book } from "@/hooks/useBooks";
import { BookOpen } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface LogReadingDialogProps {
  book: Book;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const LogReadingDialog = ({ book, open, onOpenChange, onSaved }: LogReadingDialogProps) => {
  const [minutes, setMinutes] = useState("");
  const [currentPage, setCurrentPage] = useState("");
  const [saving, setSaving] = useState(false);

  const prevPage = book.currentPage ?? 0;
  const pagesReadNum = parseInt(currentPage || "0", 10);
  const newPage = prevPage + pagesReadNum;
  const progress = book.totalPages > 0 && pagesReadNum > 0
    ? Math.min(100, Math.round((newPage / book.totalPages) * 100))
    : null;

  const handleSave = async () => {
    const minutesRead = parseInt(minutes || "0", 10);
    const pagesRead = isNaN(pagesReadNum) ? 0 : Math.max(0, pagesReadNum);

    if (minutesRead === 0 && pagesRead === 0) {
      toast.error("יש להזין דקות קריאה או עמודים שקראת");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("לא מחובר");

      const today = new Date();
      const sessionDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const { error } = await supabase.from("reading_sessions").insert({
        user_id: user.id,
        book_id: book.id,
        minutes_read: isNaN(minutesRead) ? 0 : minutesRead,
        pages_read: pagesRead,
        session_date: sessionDate,
      });

      if (error) throw error;

      // Always promote to 'reading', and advance current_page by pages read this session
      const bookUpdates: Record<string, any> = {};
      if (book.status !== 'finished') bookUpdates.status = 'reading';
      if (pagesRead > 0) bookUpdates.current_page = prevPage + pagesRead;

      const { error: updateError } = await supabase
        .from("books")
        .update(bookUpdates)
        .eq("id", book.id);

      if (updateError) throw updateError;

      trackEvent("session_logged", {
        minutes_read: isNaN(minutesRead) ? 0 : minutesRead,
        pages_read: pagesRead,
        book_status: book.status,
      });
      toast.success("הקריאה נשמרה!");
      setMinutes("");
      setCurrentPage("");
      onOpenChange(false);
      onSaved?.();
    } catch (e: any) {
      toast.error(e.message || "שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  const canSave = !saving && (!!minutes || !!currentPage);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setMinutes(""); setCurrentPage(""); } onOpenChange(v); }}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center font-serif text-lg">תיעוד קריאה</DialogTitle>
        </DialogHeader>

        {/* Book preview */}
        <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
          <div className="h-14 w-10 rounded flex-shrink-0 overflow-hidden bg-background shadow-sm">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="h-full w-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <BookOpen size={14} className="text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-serif font-bold text-sm truncate">{book.title}</p>
            <p className="text-xs text-muted-foreground truncate">{book.author}</p>
            {book.totalPages > 0 && (
              <p className="text-xs text-muted-foreground">
                {prevPage > 0 ? `עמוד ${prevPage} מתוך ${book.totalPages}` : `${book.totalPages} עמודים`}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="log-minutes">דקות קריאה</Label>
            <Input
              id="log-minutes"
              type="number"
              placeholder="30"
              value={minutes}
              onChange={e => setMinutes(e.target.value)}
              className="text-right"
              min="0"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="log-current-page">
              עמודים שקראתי
            </Label>
            <Input
              id="log-current-page"
              type="number"
              placeholder="10"
              value={currentPage}
              onChange={e => setCurrentPage(e.target.value)}
              className="text-right"
              min="0"
              max={book.totalPages > 0 ? book.totalPages - prevPage : undefined}
            />
            {prevPage > 0 && (
              <p className="text-[11px] text-muted-foreground">
                היית בעמוד {prevPage}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar - shown when current page is entered and totalPages is known */}
        {progress !== null && (
          <div className="space-y-1">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full reading-gradient transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-left">{progress}% מהספר</p>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={!canSave} className="flex-1">
            {saving ? "שומר..." : "שמור"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LogReadingDialog;
