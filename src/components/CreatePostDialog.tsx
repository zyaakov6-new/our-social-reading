import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

const CreatePostDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("יש להתחבר"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const displayName =
        (profile as any)?.display_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "קורא";

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        display_name: displayName,
        title: title.trim(),
        content: content.trim(),
      });

      if (error) throw error;

      setTitle("");
      setContent("");
      onOpenChange(false);
      onCreated();
      toast.success("הפוסט פורסם!");
    } catch (e: any) {
      toast.error(e.message || "שגיאה בפרסום");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>פוסט חדש</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="כותרת..."
            dir="rtl"
            className="w-full text-sm bg-muted/50 border border-border/50 rounded-lg px-3 py-2.5 outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/60"
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="מה תרצה לשתף?"
            dir="rtl"
            rows={5}
            className="w-full text-sm bg-muted/50 border border-border/50 rounded-lg px-3 py-2.5 outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/60 resize-none"
          />
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || submitting}
            className="w-full py-2.5 rounded-xl btn-cta font-semibold text-sm disabled:opacity-40"
          >
            {submitting ? "מפרסם…" : "פרסם"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
