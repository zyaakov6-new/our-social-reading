import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ─── Scroll-reveal hook ──────────────────────────────────────────── */
const useReveal = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
};

/* ─── Fake leaderboard data ───────────────────────────────────────── */
const LEADERS = [
  { name: "מיכל כ.", pages: 847, pct: 94, avatar: "מ", color: "#3C513E" },
  { name: "אורי ל.", pages: 721, pct: 80, avatar: "א", color: "#007788" },
  { name: "שירה ב.", pages: 654, pct: 73, avatar: "ש", color: "#E08E45" },
  { name: "דניאל מ.", pages: 590, pct: 65, avatar: "ד", color: "#3C513E" },
  { name: "נועה פ.", pages: 412, pct: 46, avatar: "נ", color: "#007788" },
];

/* ─── Feature cards data ──────────────────────────────────────────── */
const FEATURES = [
  {
    icon: "👀",
    title: "ראה מה חברים קוראים",
    desc: "הפיד מראה בזמן אמת מה כל חבר קורא עכשיו. זה מדבק - ברגע שאתה רואה, אתה רוצה לקרוא גם.",
    accent: "#3C513E",
  },
  {
    icon: "📚",
    title: "ספרייה אישית",
    desc: "עקוב אחרי כל ספר שקראת, קורא עכשיו ורוצה לקרוא. תעד עמודים ובנה היסטוריה.",
    accent: "#E08E45",
  },
  {
    icon: "⚔️",
    title: "אתגרים ודירוגים",
    desc: "אתגרי קריאה קבוצתיים ולוח דירוגים - כי קצת תחרות לא הזיקה לאף אחד.",
    accent: "#007788",
  },
];

const STEPS = [
  { n: "01", title: "הוסף ספרים", desc: "חפש וסמן ספרים שקראת, קורא עכשיו, ורוצה לקרוא." },
  { n: "02", title: "תעד קריאה", desc: "הכנס כמה עמודים קראת וקבל סטטיסטיקות מפורטות." },
  { n: "03", title: "עלה בדירוג", desc: "השתתף באתגרים ותתחרה בלוח הדירוגים מול חברים." },
];

/* ══════════════════════════════════════════════════════════════════ */
const LandingPage = () => {
  const navigate = useNavigate();
  const heroReveal = useReveal();
  const featReveal = useReveal();
  const lbReveal = useReveal();
  const stepsReveal = useReveal();
  const [barsFired, setBarsFired] = useState(false);

  useEffect(() => {
    if (lbReveal.visible && !barsFired) setBarsFired(true);
  }, [lbReveal.visible, barsFired]);

  return (
    <div dir="rtl" style={{ background: "hsl(44 27% 84%)", minHeight: "100vh", overflowX: "hidden" }}>

      {/* ── CSS keyframes ──────────────────────────────────────────── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes floatBook {
          0%, 100% { transform: translateY(0) rotate(var(--r)); }
          50%       { transform: translateY(-10px) rotate(var(--r)); }
        }
        @keyframes pulseRing {
          0%   { box-shadow: 0 0 0 0 rgba(224,142,69,0.4); }
          70%  { box-shadow: 0 0 0 12px rgba(224,142,69,0); }
          100% { box-shadow: 0 0 0 0 rgba(224,142,69,0); }
        }
        .reveal-up {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .reveal-up.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .reveal-scale {
          opacity: 0;
          transform: scale(0.94);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .reveal-scale.visible {
          opacity: 1;
          transform: scale(1);
        }
        .cta-pulse { animation: pulseRing 2s ease-in-out infinite; }
        .book-float { animation: floatBook 4s ease-in-out infinite; }
        .hero-bar { transition: width 1.2s cubic-bezier(0.16,1,0.3,1); }
      `}</style>

      {/* ══ STICKY HEADER ════════════════════════════════════════════ */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "hsl(44 27% 84% / 0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid hsl(44 12% 74%)",
        padding: "0 1.5rem",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/logo.png" alt="AMUD" style={{ width: 32, height: 32, objectFit: "contain" }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          <span style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 900, fontStyle: "italic",
            fontSize: "1.35rem", letterSpacing: "0.06em",
            color: "hsl(210 11% 14%)",
          }}>AMUD</span>
        </div>
        <button onClick={() => navigate("/auth")} style={{
          background: "hsl(126 15% 28%)",
          color: "hsl(44 30% 93%)",
          border: "none",
          borderRadius: "8px",
          padding: "8px 20px",
          fontWeight: 700,
          fontSize: "0.88rem",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "hsl(126 15% 22%)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "hsl(126 15% 28%)"; }}
        >
          כניסה / הרשמה
        </button>
      </header>

      {/* ══ HERO ═════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: "calc(100vh - 60px)",
        padding: "3rem 1.5rem 2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Floating decorative book spines */}
        {[
          { top: "8%",  left: "4%",  h: 120, w: 18, c: "#3C513E", r: "-12deg", delay: "0s" },
          { top: "15%", left: "12%", h: 90,  w: 14, c: "#007788", r: "8deg",   delay: "0.8s" },
          { top: "70%", left: "6%",  h: 140, w: 20, c: "#E08E45", r: "-6deg",  delay: "1.2s" },
          { top: "80%", left: "15%", h: 80,  w: 13, c: "#3C513E", r: "14deg",  delay: "0.4s" },
          { top: "10%", right: "5%",  h: 110, w: 16, c: "#007788", r: "10deg", delay: "0.6s" },
          { top: "20%", right: "13%", h: 95,  w: 15, c: "#E08E45", r: "-8deg", delay: "1.5s" },
          { top: "65%", right: "4%",  h: 130, w: 19, c: "#3C513E", r: "7deg",  delay: "0.2s" },
          { top: "75%", right: "14%", h: 75,  w: 12, c: "#007788", r: "-15deg",delay: "1.0s" },
        ].map((b, i) => (
          <div key={i} className="book-float" style={{
            position: "absolute",
            top: b.top,
            left: "left" in b ? b.left : undefined,
            right: "right" in b ? b.right : undefined,
            width: `${b.w}px`,
            height: `${b.h}px`,
            background: `linear-gradient(160deg, ${b.c}cc, ${b.c}55)`,
            borderRadius: "2px 4px 4px 2px",
            opacity: 0.25,
            "--r": b.r,
            animationDelay: b.delay,
            animationDuration: `${3.5 + i * 0.4}s`,
          } as React.CSSProperties} />
        ))}

        {/* Hero content */}
        <div ref={heroReveal.ref} style={{ textAlign: "center", maxWidth: "560px", position: "relative", zIndex: 2 }}>

          {/* Label badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "hsl(28 71% 57% / 0.12)",
            border: "1px solid hsl(28 71% 57% / 0.3)",
            borderRadius: "100px",
            padding: "5px 16px",
            marginBottom: "1.5rem",
            animation: heroReveal.visible ? "fadeUp 0.6s ease forwards" : "none",
            opacity: 0,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E08E45", display: "inline-block" }} className="cta-pulse" />
            <span style={{ fontWeight: 600, fontSize: "0.78rem", color: "#E08E45" }}>
              פלטפורמת הקריאה החברתית הראשונה בישראל
            </span>
          </div>

          {/* Main headline */}
          <h1 style={{
            fontSize: "clamp(2.6rem, 8vw, 4.2rem)",
            color: "hsl(210 11% 10%)",
            marginBottom: "1.2rem",
            animation: heroReveal.visible ? "fadeUp 0.7s ease 0.1s forwards" : "none",
            opacity: 0,
          }}>
            כשחברים שלך<br />
            <span style={{ color: "hsl(126 15% 28%)" }}>קוראים,</span><br />
            אתה קורא
          </h1>

          {/* Sub */}
          <p style={{
            fontSize: "1.05rem",
            color: "hsl(210 8% 38%)",
            lineHeight: 1.65,
            marginBottom: "2.4rem",
            animation: heroReveal.visible ? "fadeUp 0.7s ease 0.2s forwards" : "none",
            opacity: 0,
          }}>
            עמוד מראה לך מה חברים שלך קוראים עכשיו.<br />
            זה בדיוק מה שגורם לך לפתוח ספר.
          </p>

          {/* CTA */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            animation: heroReveal.visible ? "fadeUp 0.7s ease 0.3s forwards" : "none",
            opacity: 0,
          }}>
            <button onClick={() => navigate("/auth")} style={{
              background: "hsl(28 71% 57%)",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              padding: "16px 40px",
              fontWeight: 800,
              fontSize: "1.05rem",
              cursor: "pointer",
              transition: "transform 0.15s, box-shadow 0.15s",
              boxShadow: "0 4px 20px hsl(28 71% 57% / 0.35)",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px hsl(28 71% 57% / 0.45)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px hsl(28 71% 57% / 0.35)";
              }}
            >
              הצטרף חינם ←
            </button>
            <span style={{ fontSize: "0.75rem", color: "hsl(210 8% 52%)" }}>
              ללא כרטיס אשראי - 2 דקות להתחלה
            </span>
          </div>
        </div>

        {/* Leaderboard preview card */}
        <div style={{
          marginTop: "3rem",
          width: "100%",
          maxWidth: "380px",
          background: "hsl(44 22% 90%)",
          border: "1px solid hsl(44 12% 74%)",
          borderRadius: "16px",
          padding: "1.25rem",
          boxShadow: "0 8px 32px hsl(210 11% 14% / 0.1)",
          animation: heroReveal.visible ? "scaleIn 0.8s ease 0.45s forwards" : "none",
          opacity: 0,
          position: "relative",
          zIndex: 2,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "hsl(210 11% 14%)" }}>
              🏆 דירוג החודש
            </span>
            <span style={{
              background: "hsl(126 15% 28% / 0.12)",
              color: "hsl(126 15% 28%)",
              borderRadius: "100px",
              padding: "2px 10px",
              fontSize: "0.7rem",
              fontWeight: 600,
            }}>חי</span>
          </div>
          {LEADERS.map((l, i) => (
            <div key={l.name} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: i < 4 ? "10px" : 0 }}>
              <span style={{ fontWeight: 700, fontSize: "0.72rem", color: "hsl(210 8% 52%)", width: "16px", textAlign: "center" }}>
                {i + 1}
              </span>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: l.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: "0.7rem", color: "#fff", flexShrink: 0,
              }}>{l.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "hsl(210 11% 14%)" }}>{l.name}</span>
                  <span style={{ fontSize: "0.72rem", color: "hsl(210 8% 52%)" }}>{l.pages} עמ׳</span>
                </div>
                <div style={{ height: 5, background: "hsl(44 15% 78%)", borderRadius: "100px", overflow: "hidden" }}>
                  <div className="hero-bar" style={{
                    height: "100%",
                    borderRadius: "100px",
                    background: l.color,
                    width: heroReveal.visible ? `${l.pct}%` : "0%",
                    transitionDelay: `${0.6 + i * 0.1}s`,
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ═════════════════════════════════════════════════ */}
      <section style={{ padding: "5rem 1.5rem", maxWidth: "720px", margin: "0 auto" }}>
        <div ref={featReveal.ref}>
          <p className={`reveal-up${featReveal.visible ? " visible" : ""}`} style={{
            textAlign: "center",
            fontWeight: 700,
            fontSize: "0.78rem",
            letterSpacing: "0.12em",
            color: "hsl(126 15% 28%)",
            textTransform: "uppercase",
            marginBottom: "0.75rem",
          }}>
            מה תקבל
          </p>
          <h2 className={`reveal-up${featReveal.visible ? " visible" : ""}`} style={{
            textAlign: "center",
            fontSize: "clamp(1.8rem, 5vw, 2.5rem)",
            color: "hsl(210 11% 10%)",
            marginBottom: "3rem",
            transitionDelay: "0.1s",
          }}>
            כל מה שצריך כדי לקרוא יותר
          </h2>

          <div style={{ display: "grid", gap: "1rem" }}>
            {FEATURES.map((f, i) => (
              <div key={f.title}
                className={`reveal-up${featReveal.visible ? " visible" : ""}`}
                style={{
                  background: "hsl(44 22% 90%)",
                  border: "1px solid hsl(44 12% 74%)",
                  borderRadius: "16px",
                  padding: "1.5rem",
                  display: "flex",
                  gap: "1.25rem",
                  alignItems: "flex-start",
                  transitionDelay: `${0.15 + i * 0.12}s`,
                  borderRight: `3px solid ${f.accent}`,
                }}>
                <span style={{ fontSize: "2rem", lineHeight: 1, flexShrink: 0 }}>{f.icon}</span>
                <div>
                  <h3 style={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "hsl(210 11% 14%)",
                    marginBottom: "0.4rem",
                  }}>{f.title}</h3>
                  <p style={{
                    fontWeight: 400,
                    fontSize: "0.9rem",
                    color: "hsl(210 8% 40%)",
                    lineHeight: 1.6,
                  }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ LIVE LEADERBOARD SECTION ═════════════════════════════════ */}
      <section style={{ padding: "4rem 1.5rem", background: "hsl(44 20% 80%)" }}>
        <div ref={lbReveal.ref} style={{ maxWidth: "480px", margin: "0 auto" }}>
          <p className={`reveal-up${lbReveal.visible ? " visible" : ""}`} style={{
            fontWeight: 700,
            fontSize: "0.78rem",
            letterSpacing: "0.12em",
            color: "hsl(188 100% 27%)",
            textTransform: "uppercase",
            marginBottom: "0.75rem",
          }}>
            תחרות אמיתית
          </p>
          <h2 className={`reveal-up${lbReveal.visible ? " visible" : ""}`} style={{
            fontSize: "clamp(1.7rem, 5vw, 2.3rem)",
            color: "hsl(210 11% 10%)",
            lineHeight: 1.15,
            marginBottom: "0.6rem",
            transitionDelay: "0.1s",
          }}>
            מיכל קראה 847 עמודים<br />
            <span style={{ color: "hsl(28 71% 57%)" }}>השבוע.</span>
          </h2>
          <p className={`reveal-up${lbReveal.visible ? " visible" : ""}`} style={{
            fontSize: "0.92rem",
            color: "hsl(210 8% 42%)",
            lineHeight: 1.6,
            marginBottom: "2rem",
            transitionDelay: "0.2s",
          }}>
            כשאתה רואה שחבר שלך קורא, המוטיבציה מגיעה לבד. אין צורך בתזכורות.
          </p>

          <div className={`reveal-scale${lbReveal.visible ? " visible" : ""}`} style={{
            background: "hsl(44 22% 90%)",
            border: "1px solid hsl(44 12% 74%)",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 12px 40px hsl(210 11% 14% / 0.12)",
            transitionDelay: "0.3s",
          }}>
            <div style={{
              padding: "1rem 1.25rem",
              borderBottom: "1px solid hsl(44 12% 74%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                🏆 אתגר ינואר - "100 ספרים ביחד"
              </span>
              <span style={{
                fontSize: "0.7rem",
                background: "hsl(28 71% 57% / 0.12)",
                color: "hsl(28 71% 40%)",
                padding: "3px 10px",
                borderRadius: "100px",
                fontWeight: 600,
              }}>18 ימים נותרו</span>
            </div>

            {LEADERS.map((l, i) => (
              <div key={l.name} style={{
                padding: "0.9rem 1.25rem",
                borderBottom: i < 4 ? "1px solid hsl(44 12% 74% / 0.5)" : "none",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: i === 0 ? "hsl(28 71% 57% / 0.04)" : "transparent",
              }}>
                <span style={{
                  fontWeight: 900,
                  fontSize: i === 0 ? "1.1rem" : "0.85rem",
                  color: i === 0 ? "hsl(28 71% 50%)" : "hsl(210 8% 60%)",
                  width: "22px",
                  textAlign: "center",
                }}>
                  {i === 0 ? "🥇" : i + 1}
                </span>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: l.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: "0.8rem", color: "#fff", flexShrink: 0,
                  boxShadow: i === 0 ? `0 0 0 2px hsl(28 71% 57% / 0.4)` : "none",
                }}>{l.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                    <span style={{
                      fontWeight: i === 0 ? 700 : 500,
                      fontSize: "0.85rem",
                      color: "hsl(210 11% 14%)",
                    }}>{l.name}</span>
                    <span style={{
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      color: l.color,
                    }}>{l.pages} עמ׳</span>
                  </div>
                  <div style={{ height: 6, background: "hsl(44 15% 78%)", borderRadius: "100px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      borderRadius: "100px",
                      background: `linear-gradient(90deg, ${l.color}, ${l.color}99)`,
                      width: barsFired ? `${l.pct}%` : "0%",
                      transition: `width 1.4s cubic-bezier(0.16,1,0.3,1) ${0.1 + i * 0.12}s`,
                    }} />
                  </div>
                </div>
              </div>
            ))}

            <div style={{ padding: "0.9rem 1.25rem", textAlign: "center" }}>
              <span style={{ fontSize: "0.78rem", color: "hsl(210 8% 52%)" }}>
                הצטרף כדי לראות את הדירוג המלא שלך 👇
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ═════════════════════════════════════════════ */}
      <section style={{ padding: "5rem 1.5rem", maxWidth: "540px", margin: "0 auto" }}>
        <div ref={stepsReveal.ref}>
          <p className={`reveal-up${stepsReveal.visible ? " visible" : ""}`} style={{
            textAlign: "center",
            fontWeight: 700,
            fontSize: "0.78rem",
            letterSpacing: "0.12em",
            color: "hsl(126 15% 28%)",
            textTransform: "uppercase",
            marginBottom: "0.75rem",
          }}>
            איך מתחילים
          </p>
          <h2 className={`reveal-up${stepsReveal.visible ? " visible" : ""}`} style={{
            textAlign: "center",
            fontSize: "clamp(1.7rem, 5vw, 2.2rem)",
            color: "hsl(210 11% 10%)",
            marginBottom: "3rem",
            transitionDelay: "0.1s",
          }}>
            שלושה צעדים ואתה בתוך זה
          </h2>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {STEPS.map((s, i) => (
              <div key={s.n}
                className={`reveal-up${stepsReveal.visible ? " visible" : ""}`}
                style={{
                  display: "flex",
                  gap: "1.25rem",
                  alignItems: "flex-start",
                  transitionDelay: `${0.15 + i * 0.14}s`,
                  paddingBottom: i < 2 ? "2rem" : 0,
                  position: "relative",
                }}>
                {i < 2 && (
                  <div style={{
                    position: "absolute",
                    top: "44px",
                    right: "19px",
                    width: "2px",
                    height: "calc(100% - 44px + 2rem)",
                    background: "hsl(44 12% 74%)",
                  }} />
                )}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: i === 0 ? "hsl(28 71% 57%)" : "hsl(44 22% 90%)",
                  border: `2px solid ${i === 0 ? "hsl(28 71% 57%)" : "hsl(44 12% 74%)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  fontWeight: 900,
                  fontSize: "0.85rem",
                  color: i === 0 ? "#fff" : "hsl(210 8% 52%)",
                  position: "relative",
                  zIndex: 1,
                }}>{s.n}</div>
                <div style={{ paddingTop: "6px" }}>
                  <h3 style={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "hsl(210 11% 14%)",
                    marginBottom: "0.3rem",
                  }}>{s.title}</h3>
                  <p style={{
                    fontSize: "0.88rem",
                    color: "hsl(210 8% 42%)",
                    lineHeight: 1.6,
                  }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ════════════════════════════════════════════════ */}
      <section style={{
        background: "hsl(126 15% 28%)",
        padding: "5rem 1.5rem",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 30% 50%, hsl(126 18% 35% / 0.6) 0%, transparent 60%), radial-gradient(circle at 80% 20%, hsl(28 71% 57% / 0.15) 0%, transparent 50%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{
            fontWeight: 700,
            fontSize: "0.78rem",
            letterSpacing: "0.14em",
            color: "hsl(44 27% 84% / 0.6)",
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}>
            קרא יותר. תתחרה יותר.
          </p>

          <h2 style={{
            fontSize: "clamp(2rem, 6vw, 3rem)",
            color: "hsl(44 27% 84%)",
            lineHeight: 1.1,
            marginBottom: "1.25rem",
          }}>
            הצטרף ל-AMUD<br />
            <span style={{ color: "hsl(28 71% 65%)" }}>היום בחינם</span>
          </h2>

          <p style={{
            fontSize: "0.95rem",
            color: "hsl(44 27% 84% / 0.7)",
            marginBottom: "2.5rem",
            lineHeight: 1.6,
          }}>
            ראה מה חברים שלך קוראים - הם יראו מה אתה קורא.<br />
            כולם קוראים יותר.
          </p>

          <button onClick={() => navigate("/auth")} style={{
            background: "hsl(28 71% 57%)",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            padding: "18px 48px",
            fontWeight: 800,
            fontSize: "1.1rem",
            cursor: "pointer",
            boxShadow: "0 6px 28px hsl(28 71% 57% / 0.5)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 10px 36px hsl(28 71% 57% / 0.6)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px hsl(28 71% 57% / 0.5)";
            }}
          >
            הצטרף עכשיו - חינם ←
          </button>

          <p style={{
            marginTop: "1rem",
            fontSize: "0.75rem",
            color: "hsl(44 27% 84% / 0.45)",
          }}>
            כניסה עם Google - ללא כרטיס אשראי
          </p>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════ */}
      <footer style={{
        padding: "1.5rem",
        textAlign: "center",
        borderTop: "1px solid hsl(44 12% 74%)",
      }}>
        <span style={{ fontSize: "0.75rem", color: "hsl(210 8% 60%)" }}>
          © 2026 AMUD - כל הזכויות שמורות
        </span>
      </footer>
    </div>
  );
};

export default LandingPage;
