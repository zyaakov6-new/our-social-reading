import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Medal, Star, Flame, Clock, Target, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Period = "week" | "month" | "year";

const DATA: Record<Period, { name: string; minutes: number; color: string }[]> = {
  week:  [
    { name: "יעל כ׳",  minutes: 147, color: "bg-primary" },
    { name: "דני ל׳",  minutes: 93,  color: "bg-secondary" },
    { name: "מיכל א׳", minutes: 71,  color: "bg-[hsl(28_71%_57%)]" },
  ],
  month: [
    { name: "מיכל א׳", minutes: 610, color: "bg-[hsl(28_71%_57%)]" },
    { name: "יעל כ׳",  minutes: 540, color: "bg-primary" },
    { name: "רון ב׳",  minutes: 388, color: "bg-secondary" },
  ],
  year:  [
    { name: "דני ל׳",  minutes: 4820, color: "bg-secondary" },
    { name: "מיכל א׳", minutes: 4210, color: "bg-[hsl(28_71%_57%)]" },
    { name: "יעל כ׳",  minutes: 3990, color: "bg-primary" },
  ],
};

const MEDAL_COLORS = ["text-yellow-500", "text-slate-400", "text-amber-600"];
const PERIOD_LABEL: Record<Period, string> = { week: "השבוע", month: "החודש", year: "השנה" };

const fmtMinutes = (m: number) => {
  if (m < 60) return `${m} דק׳`;
  const h = Math.floor(m / 60), rem = m % 60;
  return rem ? `${h}:${String(rem).padStart(2, "0")} שע׳` : `${h} שע׳`;
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("week");
  const rows = DATA[period];

  return (
    <div dir="rtl" className="min-h-screen bg-background">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="block w-[3px] h-[22px] rounded-sm bg-primary flex-shrink-0" />
            <span className="font-display text-xl tracking-[0.18em] text-primary">AMUD</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="touch-manipulation">
            כניסה
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-8 space-y-6">

        {/* ── Hero ───────────────────────────────────────────────────── */}
        <div className="text-center space-y-4">
          <Badge variant="outline" className="text-xs font-bold tracking-widest uppercase px-3 py-1">
            אפליקציית מעקב קריאה חברתית
          </Badge>
          <h1
            className="font-display leading-tight tracking-[0.06em] text-primary"
            style={{ fontSize: "clamp(1.8rem, 7.5vw, 2.6rem)" }}
          >
            עקוב אחרי כל ספר.
            <br />התחרה עם חברים.
            <br />בנה הרגל שנשאר.
          </h1>
        </div>

        {/* ── Leaderboard Card ───────────────────────────────────────── */}
        <Card className="overflow-hidden">
          <CardHeader className="p-0">
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <span className="text-xs font-bold text-muted-foreground">
                לוח תוצאות — {PERIOD_LABEL[period]}
              </span>
              <Badge className="text-[10px] font-bold bg-secondary/15 text-secondary hover:bg-secondary/20 border-0">
                אתגר: 52 ספרים ב-2026
              </Badge>
            </div>

            <Tabs value={period} onValueChange={v => setPeriod(v as Period)}>
              <TabsList className="w-full rounded-none border-t border-b h-9 bg-muted/40 gap-0">
                {(["week", "month", "year"] as Period[]).map(p => (
                  <TabsTrigger
                    key={p}
                    value={p}
                    className="flex-1 rounded-none text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none touch-manipulation"
                  >
                    {PERIOD_LABEL[p]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="p-0">
            {rows.map((r, i) => (
              <div key={r.name}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="w-5 text-center text-sm font-bold text-muted-foreground flex-shrink-0">
                    {i + 1}
                  </span>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={cn("text-[11px] font-bold text-white", r.color)}>
                      {r.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm font-semibold">{r.name}</span>
                  <Medal size={14} className={cn("flex-shrink-0", MEDAL_COLORS[i])} />
                  <span className="text-xs font-bold text-secondary">{fmtMinutes(r.minutes)}</span>
                </div>
                <Separator />
              </div>
            ))}

            {/* "You could be here" row */}
            <div className="flex items-center gap-3 px-4 py-3 bg-primary">
              <span className="w-5 text-center text-sm font-bold text-primary-foreground/50 flex-shrink-0">?</span>
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary-foreground/15 text-primary-foreground/60 text-sm font-bold">?</AvatarFallback>
              </Avatar>
              <span className="flex-1 text-sm font-semibold text-primary-foreground/85">
                את/ה יכול/ה להיות כאן
              </span>
              <Button
                size="sm"
                onClick={() => navigate("/auth")}
                className="bg-[hsl(28_71%_57%)] hover:bg-[hsl(28_71%_50%)] text-white border-0 h-7 px-3 text-xs touch-manipulation"
              >
                הצטרף
              </Button>
            </div>

            {/* Motivational footer */}
            <div className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[hsl(28_71%_57%/0.06)]">
              <Star size={11} className="text-[hsl(28_71%_50%)] fill-current flex-shrink-0" />
              <span className="text-[11px] font-semibold text-[hsl(28_71%_45%)]">
                {rows[0].name} קרא/ה {fmtMinutes(rows[0].minutes)} — אתה יכול לנצח {PERIOD_LABEL[period]}!
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ── App preview — 3 stat mini-cards ───────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="flex flex-col items-center py-3 px-2 gap-1">
              <Flame size={18} className="text-[hsl(28_71%_57%)]" />
              <span className="text-xl font-extrabold text-[hsl(28_71%_45%)] leading-none">12</span>
              <span className="text-[9px] text-muted-foreground text-center">יום רצף</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center py-3 px-2 gap-1">
              <Clock size={18} className="text-secondary" />
              <span className="text-xl font-extrabold text-secondary leading-none">3:20</span>
              <span className="text-[9px] text-muted-foreground text-center">שעות השבוע</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center py-3 px-2 gap-1">
              <Target size={18} className="text-primary" />
              <span className="text-xl font-extrabold text-primary leading-none">7</span>
              <span className="text-[9px] text-muted-foreground text-center">ספרים</span>
            </CardContent>
          </Card>
        </div>

        {/* Goal progress bars */}
        <Card>
          <CardContent className="py-3 px-4 space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-primary">יעד יומי</span>
                <span className="text-[10px] text-muted-foreground">25/30 דקות</span>
              </div>
              <Progress value={83} className="h-1.5" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-primary">יעד 2026</span>
                <span className="text-[10px] text-muted-foreground">7/24 ספרים</span>
              </div>
              <Progress value={29} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        {/* ── CTAs ───────────────────────────────────────────────────── */}
        <div className="space-y-2.5">
          <Button
            size="lg"
            className="w-full touch-manipulation"
            onClick={() => navigate("/feed")}
          >
            נסה בלי הרשמה ←
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full touch-manipulation"
            onClick={() => navigate("/auth")}
          >
            הצטרף עכשיו
          </Button>
        </div>

      </main>

      {/* ── Final CTA ──────────────────────────────────────────────── */}
      <section className="px-5 pb-16 max-w-lg mx-auto">
        <Card className="bg-primary text-primary-foreground text-center overflow-hidden">
          <CardContent className="py-10 px-6 space-y-4">
            <h3 className="font-display text-2xl tracking-wide">הפסק לקרוא לבד.</h3>
            <p className="text-sm leading-relaxed opacity-80">
              הצטרף לראשונים שבונים הרגל קריאה שנשאר - ספר אחרי ספר.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs opacity-70">
              <Users size={13} />
              <span>847 קוראים כבר הצטרפו</span>
            </div>
            <Button
              size="lg"
              variant="secondary"
              className="bg-background text-primary hover:bg-background/90 touch-manipulation"
              onClick={() => navigate("/auth")}
            >
              הצטרף עכשיו ←
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t py-6 text-center">
        <p className="text-xs text-muted-foreground">AMUD - קריאה חברתית בעברית</p>
      </footer>

    </div>
  );
}
