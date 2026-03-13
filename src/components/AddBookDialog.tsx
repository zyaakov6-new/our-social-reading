import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddBookDialogProps {
  onBookAdded?: () => void;
}

const AddBookDialog = ({ onBookAdded }: AddBookDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [status, setStatus] = useState<"want" | "reading" | "finished">("want");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      toast.error("יש למלא שם ומחבר");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("לא מחובר");

      const { error } = await supabase.from("books").insert({
        user_id: user.id,
        title: title.trim(),
        author: author.trim(),
        total_pages: totalPages ? parseInt(totalPages, 10) : 0,
        current_page: 0,
        status,
      });

      if (error) throw error;

      toast.success("הספר נוסף בהצלחה!");
      setOpen(false);
      setTitle("");
      setAuthor("");
      setTotalPages("");
      setStatus("want");
      onBookAdded?.();
    } catch (error: any) {
      toast.error(error.message || "שגיאה בהוספת הספר");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full rounded-xl border-2 border-dashed border-primary/30 py-4 text-primary font-semibold hover:bg-primary/5 transition-colors">
          + הוסף ספר
        </button>
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center font-serif text-xl">הוספת ספר חדש</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">שם הספר</Label>
            <Input
              id="title"
              placeholder="שם הספר"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-right"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author">מחבר</Label>
            <Input
              id="author"
              placeholder="שם המחבר"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="text-right"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pages">מספר עמודים (אופציונלי)</Label>
            <Input
              id="pages"
              type="number"
              placeholder="0"
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
              className="text-right"
              min="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">סטטוס</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger className="text-right">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="want">רוצה לקרוא</SelectItem>
                <SelectItem value="reading">קורא עכשיו</SelectItem>
                <SelectItem value="finished">סיימתי</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              ביטול
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "שומר..." : "הוסף"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBookDialog;
