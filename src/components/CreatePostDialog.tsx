import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Category = 'review' | 'discussion' | 'question' | 'recommendation';

const CATEGORIES: { value: Category; emoji: string; label: string; placeholder: string }[] = [
  {
    value: 'review',
    emoji: '📖',
    label: 'ביקורת',
    placeholder: 'שתף את דעתך על ספר שקראת — מה אהבת, מה פחות, האם תמליץ?',
  },
  {
    value: 'discussion',
    emoji: '💬',
    label: 'דיון',
    placeholder: 'פתח שיחה על נושא ספרותי — שאלה פתוחה, מחשבה, ויכוח...',
  },
  {
    value: 'recommendation',
    emoji: '✨',
    label: 'המלצה',
    placeholder: 'ספר שחייבים לקרוא — למה הוא מיוחד ולמי הוא מתאים?',
  },
  {
    value: 'question',
    emoji: '❓',
    label: 'שאלה',
    placeholder: 'שאל את הקהילה — על ספר, ז׳אנר, הרגלי קריאה, כל דבר...',
  },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
  initialCategory?: Category;
}

const CreatePostDialog = ({ open, onOpenChange, onCreated, initialCategory }: Props) => {
  const [category, setCategory] = useState<Category>(initialCategory ?? 'discussion');
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedCat = CATEGORIES.find(c => c.value === category)!;

  const handleClose = (v: boolean) => {
    onOpenChange(v);
    if (!v) { setTitle(""); setContent(""); setCategory(initialCategory ?? 'discussion'); }
  };

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
        category,
      });

      if (error) throw error;

      setTitle("");
      setContent("");
      setCategory(initialCategory ?? 'discussion');
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">פוסט חדש בפורום</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">

          {/* Category picker */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">בחר קטגוריה</p>
            <div className="grid grid-cols-4 gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={
                    category === cat.value
                      ? { background: 'hsl(126 15% 28%)', color: 'white' }
                      : { background: 'hsl(44 20% 90%)', color: 'hsl(126 15% 28%)' }
                  }
                >
                  <span className="text-base leading-none">{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="כותרת..."
            dir="rtl"
            className="w-full text-sm bg-muted/50 border border-border/50 rounded-lg px-3 py-2.5 outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/60"
          />

          {/* Content */}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={selectedCat.placeholder}
            dir="rtl"
            rows={5}
            className="w-full text-sm bg-muted/50 border border-border/50 rounded-lg px-3 py-2.5 outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/60 resize-none"
          />

          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || submitting}
            className="w-full py-2.5 rounded-xl btn-cta font-semibold text-sm disabled:opacity-40"
          >
            {submitting ? "מפרסם…" : `פרסם ${selectedCat.emoji} ${selectedCat.label}`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
