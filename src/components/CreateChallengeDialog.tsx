import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useChallenges } from "@/hooks/useChallenges";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

const PRESETS = [
  { label: "שבוע: 140 דק׳", goalType: "minutes" as const, goalValue: 140, days: 7 },
  { label: "חודש: 600 דק׳", goalType: "minutes" as const, goalValue: 600, days: 30 },
  { label: "חודש: 5 ספרים", goalType: "books" as const, goalValue: 5, days: 30 },
];

const CreateChallengeDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const { createChallenge } = useChallenges();
  const [name, setName] = useState("");
  const [goalType, setGoalType] = useState<"minutes" | "books">("minutes");
  const [goalValue, setGoalValue] = useState("");
  const [days, setDays] = useState("30");
  const [saving, setSaving] = useState(false);

  const reset = () => { setName(""); setGoalType("minutes"); setGoalValue(""); setDays("30"); };

  const handlePreset = (p: typeof PRESETS[0]) => {
    setGoalType(p.goalType);
    setGoalValue(p.goalValue.toString());
    setDays(p.days.toString());
  };

  const handleSubmit = async () => {
    if (!name.trim() || !goalValue || !days) { toast.error("יש למלא את כל השדות"); return; }
    setSaving(true);
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(days));
      await createChallenge(name.trim(), goalType, parseInt(goalValue), endDate.toISOString().split("T")[0]);
      toast.success("האתגר נוצר!");
      onOpenChange(false);
      reset();
      onCreated();
    } catch (e: any) {
      toast.error(e.message || "שגיאה");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center font-serif text-xl">אתגר חדש</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map(p => (
              <button key={p.label} type="button" onClick={() => handlePreset(p)}
                className="text-xs rounded-full px-3 py-1.5 bg-muted hover:bg-accent transition-colors font-medium">
                {p.label}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label>שם האתגר</Label>
            <Input placeholder='למשל: "קריאה עם חברים - מרץ"' value={name} onChange={e => setName(e.target.value)} className="text-right" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>סוג יעד</Label>
              <div className="flex gap-2">
                {(["minutes", "books"] as const).map(t => (
                  <button key={t} type="button" onClick={() => setGoalType(t)}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${goalType === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-accent'}`}>
                    {t === "minutes" ? "דקות" : "ספרים"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>יעד ({goalType === "minutes" ? "דקות" : "ספרים"})</Label>
              <Input type="number" placeholder={goalType === "minutes" ? "600" : "5"} value={goalValue} onChange={e => setGoalValue(e.target.value)} className="text-right" min="1" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>משך (ימים)</Label>
            <Input type="number" placeholder="30" value={days} onChange={e => setDays(e.target.value)} className="text-right" min="1" />
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">ביטול</Button>
            <Button onClick={handleSubmit} disabled={saving || !name.trim() || !goalValue} className="flex-1 btn-cta">
              {saving ? "יוצר..." : "צור אתגר"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChallengeDialog;
