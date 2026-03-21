import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ─── Scroll-reveal hook ─────────────────────────────────────────── */
const useReveal = (threshold = 0.12) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
};

/* ─── Data ───────────────────────────────────────────────────────── */
const LEADERS = [
  { name: "מיכל כ.", pages: 847, pct: 94, avatar: "מ", color: "#3C513E" },
  { name: "אורי ל.",  pages: 721, pct: 80, avatar: "א", color: "#007788" },
  { name: "שירה ב.", pages: 654, pct: 73, avatar: "ש", color: "#E08E45" },
  { name: "דניאל מ.", pages: 590, pct: 65, avatar: "ד", color: "#3C513E" },
  { name: "נועה פ.", pages: 412, pct: 46, avatar: "נ", color: "#007788" },
];

const FEATURES = [
  {
    n: "01",
    title: "ראה מה חברים קוראים",
    desc: "הפיד מראה בזמן אמת מה כל חבר קורא עכשיו. ברגע שאתה רואה - אתה רוצה לקרוא גם.",
    accent: "#3C513E",
  },
  {
    n: "02",
    title: "ספרייה אישית",
    desc: "עקוב אחרי כל ספר שקראת, קורא עכשיו ורוצה לקרוא. תעד עמודים ובנה היסטוריה.",
    accent: "#007788",
  },
  {
    n: "03",
    title: "אתגרים ודירוגים",
    desc: "אתגרי קריאה קבוצתיים ולוח דירוגים - כי קצת תחרות לא הזיקה לאף אחד.",
    accent: "#E08E45",
  },
];

/* ══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const featRef   = useReveal();
  const lbRef     = useReveal();
  const ctaRef    = useReveal();
  const [barsOn, setBarsOn] = useState(false);

  useEffect(() => { if (lbRef.visible) setBarsOn(true); }, [lbRef.visible]);

  /* ── palette shortcuts ─────────────────────────────────────────── */
  const INK    = "#1A2319";   // near-black green — hero bg
  const VELLUM = "#EDE7D9";   // warm cream
  const GREEN  = "#3C513E";
  const AMBER  = "#E08E45";
  const TEAL   = "#007788";
  const CREAM  = "#F4EFE4";   // lighter cream for cards
  const MUTED  = "#8B8070";   // warm gray

  return (
    <div dir="rtl" style={{ background: VELLUM, minHeight: "100vh", overflowX: "hidden" }}>

      <style>{`
        /* ── animations ─────────────────────────────────── */
        @keyframes fadeUp   { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:none } }
        @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes barGrow  { from { width:0 } }
        @keyframes drift    {
          0%,100% { transform: translateY(0) rotate(var(--r,0deg)); }
          50%     { transform: translateY(-8px) rotate(var(--r,0deg)); }
        }
        @keyframes pulse {
          0%,100% { opacity:1 } 50% { opacity:0.4 }
        }

        /* ── utility reveal classes ─────────────────────── */
        .rv { opacity:0; transform:translateY(20px); transition: opacity .65s ease, transform .65s ease; }
        .rv.on { opacity:1; transform:none; }

        /* ── leaderboard bar ────────────────────────────── */
        .lb-bar { width:0; transition: width 1.2s cubic-bezier(.16,1,.3,1); }
        .lb-bar.on { width: var(--w); }

        /* ── link buttons ───────────────────────────────── */
        .btn-primary {
          display: inline-flex; align-items: center; gap: 10px;
          background: ${AMBER}; color: #fff;
          border: none; border-radius: 4px;
          padding: 15px 36px;
          font-family: 'Heebo', sans-serif; font-weight: 800; font-size: 1rem;
          cursor: pointer; letter-spacing: 0.01em;
          transition: background .18s, transform .15s, box-shadow .15s;
          box-shadow: 0 2px 12px ${AMBER}55;
        }
        .btn-primary:hover {
          background: #cd7d34;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px ${AMBER}66;
        }
        .btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: ${VELLUM};
          border: 1px solid ${VELLUM}55; border-radius: 4px;
          padding: 9px 22px;
          font-family: 'Heebo', sans-serif; font-weight: 600; font-size: 0.85rem;
          cursor: pointer; letter-spacing: 0.01em;
          transition: border-color .18s, color .18s;
        }
        .btn-outline:hover { border-color: ${VELLUM}cc; color: #fff; }

        /* ── section label ──────────────────────────────── */
        .section-label {
          display: flex; align-items: center; gap: 12px;
          font-family: 'Heebo', sans-serif; font-weight: 700;
          font-size: 0.68rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: ${MUTED};
          margin-bottom: 1.25rem;
        }
        .section-label::before {
          content: ''; display: block;
          width: 28px; height: 1px; background: currentColor; flex-shrink: 0;
        }

        /* ── hairline divider ───────────────────────────── */
        .hairline { border: none; border-top: 1px solid; opacity: 0.15; }

        /* ── avatar ring ────────────────────────────────── */
        .av { border-radius: 50%; display:flex; align-items:center; justify-content:center;
              font-family:'Heebo',sans-serif; font-weight:700; color:#fff; flex-shrink:0; }

        /* ── live dot ───────────────────────────────────── */
        .live-dot { width:6px; height:6px; border-radius:50%; background:${AMBER};
                    display:inline-block; animation: pulse 2s ease-in-out infinite; }

        /* ── grain overlay ──────────────────────────────── */
        .grain::after {
          content:''; position:absolute; inset:0; pointer-events:none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.055'/%3E%3C/svg%3E");
          background-size: 180px;
        }

        /* ── card ───────────────────────────────────────── */
        .app-card {
          background: ${CREAM}; border: 1px solid rgba(60,81,62,.12);
          border-radius: 10px; overflow: hidden;
        }
      `}</style>

      {/* ══ HEADER ═══════════════════════════════════════════════════ */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: `${INK}f2`,
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${VELLUM}18`,
        padding: "0 clamp(1.25rem, 4vw, 3rem)",
        height: 58,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" alt="AMUD" style={{ width: 28, height: 28, objectFit: "contain", opacity: .9 }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          <span style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 900, fontStyle: "italic",
            fontSize: "1.25rem", letterSpacing: "0.07em",
            color: VELLUM,
          }}>AMUD</span>
        </div>

        {/* Nav actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <button className="btn-outline" onClick={() => navigate("/auth")}>
            כניסה
          </button>
          <button className="btn-primary" onClick={() => navigate("/auth")}
            style={{ padding: "9px 22px", fontSize: "0.85rem" }}>
            הרשמה ←
          </button>
        </div>
      </header>

      {/* ══ HERO ═════════════════════════════════════════════════════ */}
      <section className="grain" style={{
        background: INK,
        minHeight: "calc(100vh - 58px)",
        display: "grid",
        gridTemplateColumns: "clamp(280px, 55%, 600px) 1fr",
        gap: "clamp(2rem, 5vw, 5rem)",
        alignItems: "center",
        padding: "clamp(3rem,7vw,5rem) clamp(1.25rem,4vw,3rem)",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Watermark — huge faded Hebrew word */}
        <div aria-hidden style={{
          position: "absolute",
          insetInlineStart: "-3%",
          top: "50%", transform: "translateY(-52%)",
          fontFamily: "'Frank Ruhl Libre', serif",
          fontWeight: 900,
          fontSize: "clamp(16rem, 38vw, 32rem)",
          color: VELLUM,
          opacity: 0.028,
          lineHeight: 1,
          userSelect: "none",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}>קורא</div>

        {/* ── Left panel: text ──────────────────────────────────────── */}
        <div style={{ position: "relative", zIndex: 2 }}>

          {/* badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            border: `1px solid ${AMBER}44`,
            borderRadius: 3,
            padding: "4px 14px",
            marginBottom: "1.75rem",
            animation: "fadeIn .6s ease forwards",
            opacity: 0,
          }}>
            <span className="live-dot" />
            <span style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 600, fontSize: "0.72rem", color: AMBER, letterSpacing: "0.06em" }}>
              פלטפורמת הקריאה החברתית הראשונה בישראל
            </span>
          </div>

          {/* headline */}
          <h1 style={{
            fontFamily: "'Frank Ruhl Libre', serif",
            fontWeight: 900,
            fontSize: "clamp(3rem, 7.5vw, 5.2rem)",
            lineHeight: 1.06,
            color: VELLUM,
            marginBottom: "1.5rem",
            animation: "fadeUp .7s ease .1s forwards",
            opacity: 0,
          }}>
            כשחברים שלך<br />
            <em style={{ fontStyle: "normal", color: AMBER }}>קוראים,</em><br />
            אתה קורא
          </h1>

          {/* rule */}
          <div style={{ width: 48, height: 2, background: GREEN, marginBottom: "1.25rem",
            animation: "fadeIn .5s ease .3s forwards", opacity: 0 }} />

          {/* sub */}
          <p style={{
            fontFamily: "'Heebo', sans-serif", fontWeight: 400,
            fontSize: "clamp(.95rem, 2vw, 1.05rem)", color: `${VELLUM}99`,
            lineHeight: 1.7, marginBottom: "2.5rem",
            animation: "fadeUp .7s ease .25s forwards", opacity: 0,
            maxWidth: 440,
          }}>
            עמוד מראה לך מה חברים שלך קוראים עכשיו.<br />
            זה בדיוק מה שגורם לך לפתוח ספר.
          </p>

          {/* CTA row */}
          <div style={{
            display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20,
            animation: "fadeUp .7s ease .38s forwards", opacity: 0,
          }}>
            <button className="btn-primary" onClick={() => navigate("/auth")}>
              הצטרף חינם ←
            </button>
            <span style={{ fontFamily: "'Heebo', sans-serif", fontSize: "0.75rem", color: `${VELLUM}55` }}>
              ללא כרטיס אשראי
            </span>
          </div>
        </div>

        {/* ── Right panel: leaderboard card ────────────────────────── */}
        <div style={{
          position: "relative", zIndex: 2,
          animation: "fadeUp .8s ease .5s forwards", opacity: 0,
        }}>
          {/* glow behind card */}
          <div style={{
            position: "absolute", inset: "-20px",
            background: `radial-gradient(ellipse at 50% 50%, ${GREEN}55 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />

          <div className="app-card" style={{ position: "relative", maxWidth: 340, marginInlineStart: "auto" }}>
            {/* card header */}
            <div style={{
              padding: "0.9rem 1.1rem",
              borderBottom: `1px solid ${GREEN}22`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: `${GREEN}0D`,
            }}>
              <span style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#1a1a1a" }}>
                🏆 דירוג החודש
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="live-dot" />
                <span style={{ fontFamily: "'Heebo', sans-serif", fontSize: "0.68rem", fontWeight: 600, color: MUTED, letterSpacing: "0.08em" }}>חי</span>
              </div>
            </div>

            {/* rows */}
            {LEADERS.map((l, i) => (
              <div key={l.name} style={{
                padding: "0.75rem 1.1rem",
                borderBottom: i < 4 ? `1px solid ${GREEN}12` : "none",
                display: "flex", alignItems: "center", gap: 10,
                background: i === 0 ? `${AMBER}08` : "transparent",
              }}>
                <span style={{
                  fontFamily: "'Frank Ruhl Libre', serif", fontWeight: 900,
                  fontSize: i === 0 ? "0.9rem" : "0.75rem",
                  color: i === 0 ? AMBER : MUTED,
                  width: 18, textAlign: "center", flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                <div className="av" style={{ width: 30, height: 30, fontSize: "0.68rem", background: l.color }}>
                  {l.avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Heebo', sans-serif", fontSize: "0.78rem", fontWeight: i === 0 ? 700 : 500, color: "#1a1a1a" }}>{l.name}</span>
                    <span style={{ fontFamily: "'Heebo', sans-serif", fontSize: "0.7rem", color: MUTED }}>{l.pages} עמ׳</span>
                  </div>
                  <div style={{ height: 4, background: `${GREEN}18`, borderRadius: 2, overflow: "hidden" }}>
                    <div className={`lb-bar${barsOn ? " on" : ""}`}
                      style={{ "--w": `${l.pct}%`, height: "100%", background: l.color, borderRadius: 2,
                        transitionDelay: `${0.55 + i * 0.08}s` } as React.CSSProperties} />
                  </div>
                </div>
              </div>
            ))}

            <div style={{ padding: "0.7rem 1.1rem", textAlign: "center" }}>
              <span style={{ fontFamily: "'Heebo', sans-serif", fontSize: "0.72rem", color: MUTED }}>
                הצטרף כדי לראות את המיקום שלך 👇
              </span>
            </div>
          </div>
        </div>

        {/* scroll hint */}
        <div style={{
          position: "absolute", bottom: "2rem",
          left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          animation: "fadeIn 1s ease 1.4s forwards", opacity: 0,
        }}>
          <span style={{ fontFamily: "'Heebo', sans-serif", fontSize: "0.65rem", color: `${VELLUM}44`, letterSpacing: "0.1em" }}>גלול למטה</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.3 }}>
            <path d="M8 3v10M3 9l5 5 5-5" stroke={VELLUM} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </section>

      {/* ══ PULL QUOTE ═══════════════════════════════════════════════ */}
      <section style={{ background: CREAM, padding: "5rem clamp(1.25rem,4vw,3rem)", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 700, marginInlineStart: "auto", marginInlineEnd: "auto", position: "relative" }}>
          {/* giant decorative quote mark */}
          <div aria-hidden style={{
            position: "absolute", insetInlineEnd: "-1rem", top: "-2.5rem",
            fontFamily: "'Frank Ruhl Libre', serif", fontWeight: 900,
            fontSize: "14rem", lineHeight: 1, color: GREEN, opacity: 0.06,
            userSelect: "none", pointerEvents: "none",
          }}>״</div>

          <blockquote style={{ position: "relative" }}>
            <p style={{
              fontFamily: "'Frank Ruhl Libre', serif", fontWeight: 500,
              fontSize: "clamp(1.4rem, 3.5vw, 2rem)", lineHeight: 1.55,
              color: "#1a1a1a",
              marginBottom: "1.25rem",
            }}>
              קריאה לא חייבת להיות דבר בודד. כשאתה יודע שחבר שלך קורא ספר ביחד איתך - אתה פותח אותו.
            </p>
            <footer style={{ fontFamily: "'Heebo', sans-serif", fontSize: "0.78rem", color: MUTED, letterSpacing: "0.06em" }}>
              — הרעיון מאחורי עמוד
            </footer>
          </blockquote>
        </div>
      </section>

      {/* ══ FEATURES ═════════════════════════════════════════════════ */}
      <section style={{ background: VELLUM, padding: "6rem clamp(1.25rem,4vw,3rem)" }}>
        <div ref={featRef.ref} style={{ maxWidth: 800, marginInlineStart: "auto", marginInlineEnd: "auto" }}>

          <div className="section-label" style={{ color: MUTED }}>מה תקבל</div>

          <hr className="hairline" style={{ borderColor: GREEN, marginBottom: "3.5rem" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {FEATURES.map((f, i) => (
              <div key={f.n}
                className={`rv${featRef.visible ? " on" : ""}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr",
                  gap: "clamp(1rem,3vw,2.5rem)",
                  alignItems: "start",
                  padding: "2.5rem 0",
                  borderBottom: i < 2 ? `1px solid ${GREEN}18` : "none",
                  transitionDelay: `${i * 0.14}s`,
                }}>
                {/* big number */}
                <div style={{
                  fontFamily: "'Frank Ruhl Libre', serif", fontWeight: 900,
                  fontSize: "clamp(2.5rem, 5vw, 3.5rem)", lineHeight: 1,
                  color: f.accent, opacity: 0.22,
                  paddingTop: 2,
                }}>{f.n}</div>

                <div>
                  <h3 style={{
                    fontFamily: "'Frank Ruhl Libre', serif", fontWeight: 700,
                    fontSize: "clamp(1.1rem, 2.5vw, 1.35rem)",
                    color: "#1a1a1a", marginBottom: "0.6rem",
                  }}>{f.title}</h3>
                  <p style={{
                    fontFamily: "'Heebo', sans-serif", fontWeight: 400,
                    fontSize: "0.93rem", color: MUTED, lineHeight: 1.7,
                  }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ LEADERBOARD SECTION ══════════════════════════════════════ */}
      <section className="grain" style={{
        background: INK, padding: "6rem clamp(1.25rem,4vw,3rem)",
        position: "relative", overflow: "hidden",
      }}>
        {/* decorative arc */}
        <div aria-hidden style={{
          position: "absolute", insetInlineStart: "-10%", bottom: "-20%",
          width: "55vw", height: "55vw",
          border: `1px solid ${VELLUM}09`, borderRadius: "50%",
          pointerEvents: "none",
        }} />

        <div ref={lbRef.ref} style={{
          maxWidth: 800, marginInlineStart: "auto", marginInlineEnd: "auto",
          display: "grid",
          gridTemplateColumns: "1fr clamp(260px, 42%, 380px)",
          gap: "clamp(2rem,5vw,5rem)",
          alignItems: "center",
        }}>
          {/* text */}
          <div className={`rv${lbRef.visible ? " on" : ""}`}>
            <div className="section-label" style={{ color: `${VELLUM}44` }}>תחרות אמיתית</div>

            <h2 style={{
              fontFamily: "'Frank Ruhl Libre', serif", fontWeight: 900,
              fontSize: "clamp(2rem, 5vw, 3rem)", color: VELLUM,
              lineHeight: 1.1, marginBottom: "1rem",
            }}>
              מיכל קראה<br />
              <span style={{ color: AMBER }}>847 עמודים</span><br />
              השבוע.
            </h2>

            <p style={{
              fontFamily: "'Heebo', sans-serif", fontSize: "0.95rem",
              color: `${VELLUM}77`, lineHeight: 1.7, marginBottom: "2rem",
            }}>
              כשאתה רואה שחבר שלך קורא, המוטיבציה מגיעה לבד.<br />
              אין צורך בתזכורות.
            </p>

            <button className="btn-primary" onClick={() => navigate("/auth")}>
              הצטרף ←
            </button>
          </div>

          {/* full leaderboard */}
          <div className={`rv${lbRef.visible ? " on" : ""}`} style={{ transitionDelay: "0.15s" }}>
            <div className="app-card">
              <div style={{
                padding: "0.85rem 1rem",
                borderBottom: `1px solid ${GREEN}22`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: `${GREEN}0A`,
              }}>
                <span style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: "0.8rem" }}>
                  אתגר ינואר - "100 ספרים ביחד"
                </span>
                <span style={{ fontFamily: "'Heebo', sans-serif", fontSize: "0.68rem", fontWeight: 600,
                  background: `${AMBER}1A`, color: AMBER, padding: "2px 9px", borderRadius: 3 }}>
                  18 ימים
                </span>
              </div>

              {LEADERS.map((l, i) => (
                <div key={l.name} style={{
                  padding: "0.7rem 1rem",
                  borderBottom: i < 4 ? `1px solid ${GREEN}10` : "none",
                  display: "flex", alignItems: "center", gap: 10,
                  background: i === 0 ? `${AMBER}06` : "transparent",
                }}>
                  <span style={{
                    fontFamily: "'Frank Ruhl Libre', serif", fontWeight: 900,
                    fontSize: i === 0 ? "0.9rem" : "0.72rem",
                    color: i === 0 ? AMBER : MUTED,
                    width: 18, textAlign: "center", flexShrink: 0,
                  }}>
                    {i === 0 ? "🥇" : i + 1}
                  </span>
                  <div className="av" style={{ width: 28, height: 28, fontSize: "0.65rem", background: l.color }}>
                    {l.avatar}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontFamily: "'Heebo', sans-serif", fontSize: "0.76rem", fontWeight: i===0?700:500 }}>{l.name}</span>
                      <span style={{ fontFamily: "'Heebo', sans-serif", fontSize: "0.68rem", color: l.color, fontWeight: 600 }}>{l.pages}</span>
                    </div>
                    <div style={{ height: 4, background: `${GREEN}1A`, borderRadius: 2, overflow: "hidden" }}>
                      <div className={`lb-bar${barsOn ? " on" : ""}`}
                        style={{ "--w": `${l.pct}%`, height: "100%",
                          background: `linear-gradient(90deg,${l.color},${l.color}BB)`,
                          borderRadius: 2, transitionDelay: `${0.2 + i * 0.1}s` } as React.CSSProperties} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ═════════════════════════════════════════════ */}
      <section style={{ background: CREAM, padding: "6rem clamp(1.25rem,4vw,3rem)" }}>
        <div style={{ maxWidth: 800, marginInlineStart: "auto", marginInlineEnd: "auto" }}>
          <div className="section-label" style={{ color: MUTED }}>איך מתחילים</div>

          <h2 style={{
            fontFamily: "'Frank Ruhl Libre', serif", fontWeight: 900,
            fontSize: "clamp(1.8rem, 4vw, 2.4rem)", color: "#1a1a1a",
            marginBottom: "3.5rem",
          }}>
            שלושה צעדים ואתה בתוך זה
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2.5rem" }}>
            {[
              { n: "1", title: "הוסף ספרים",   desc: "חפש וסמן ספרים שקראת, קורא עכשיו, ורוצה לקרוא." },
              { n: "2", title: "תעד קריאה",     desc: "הכנס כמה עמודים קראת וקבל סטטיסטיקות מפורטות." },
              { n: "3", title: "עלה בדירוג",    desc: "השתתף באתגרים ותתחרה בלוח הדירוגים מול חברים." },
            ].map((s) => (
              <div key={s.n} style={{ position: "relative", paddingTop: "1rem" }}>
                {/* step number */}
                <div style={{
                  fontFamily: "'Frank Ruhl Libre', serif", fontWeight: 900,
                  fontSize: "3.5rem", lineHeight: 1, color: GREEN, opacity: 0.14,
                  marginBottom: "0.5rem",
                }}>{s.n}</div>
                <div style={{ width: 32, height: 2, background: GREEN, opacity: 0.4, marginBottom: "0.85rem" }} />
                <h3 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontWeight: 700, fontSize: "1.1rem", color: "#1a1a1a", marginBottom: "0.5rem" }}>{s.title}</h3>
                <p style={{ fontFamily: "'Heebo', sans-serif", fontSize: "0.88rem", color: MUTED, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ════════════════════════════════════════════════ */}
      <section className="grain" ref={ctaRef.ref} style={{
        background: INK, padding: "7rem clamp(1.25rem,4vw,3rem)",
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        {/* decorative rings */}
        {[320, 520, 720].map(s => (
          <div key={s} aria-hidden style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: s, height: s,
            border: `1px solid ${VELLUM}07`, borderRadius: "50%",
            pointerEvents: "none",
          }} />
        ))}

        <div className={`rv${ctaRef.visible ? " on" : ""}`} style={{ position: "relative", zIndex: 1 }}>
          <div className="section-label" style={{ color: `${VELLUM}33`, justifyContent: "center" }}>
            קרא יותר
          </div>

          <h2 style={{
            fontFamily: "'Frank Ruhl Libre', serif", fontWeight: 900,
            fontSize: "clamp(2.2rem, 6vw, 3.5rem)", color: VELLUM,
            lineHeight: 1.1, marginBottom: "1rem",
          }}>
            הצטרף ל-AMUD<br />
            <span style={{ color: AMBER }}>היום בחינם</span>
          </h2>

          <p style={{
            fontFamily: "'Heebo', sans-serif", fontSize: "0.95rem",
            color: `${VELLUM}66`, marginBottom: "2.5rem", lineHeight: 1.7,
          }}>
            ראה מה חברים שלך קוראים - הם יראו מה אתה קורא.<br />
            כולם קוראים יותר.
          </p>

          <button className="btn-primary" onClick={() => navigate("/auth")}
            style={{ fontSize: "1.05rem", padding: "16px 44px" }}>
            הצטרף עכשיו - חינם ←
          </button>

          <p style={{
            marginTop: "1.25rem",
            fontFamily: "'Heebo', sans-serif", fontSize: "0.72rem",
            color: `${VELLUM}33`,
          }}>
            כניסה עם Google - ללא כרטיס אשראי
          </p>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════ */}
      <footer style={{
        background: INK,
        borderTop: `1px solid ${VELLUM}12`,
        padding: "1.5rem clamp(1.25rem,4vw,3rem)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "0.5rem",
      }}>
        <span style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 900, fontStyle: "italic",
          fontSize: "1rem", letterSpacing: "0.06em", color: `${VELLUM}44`,
        }}>AMUD</span>
        <span style={{ fontFamily: "'Heebo', sans-serif", fontSize: "0.72rem", color: `${VELLUM}33` }}>
          © 2026 AMUD - כל הזכויות שמורות
        </span>
      </footer>
    </div>
  );
}
