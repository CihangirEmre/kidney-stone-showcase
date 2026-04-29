import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const GRID_COLS = 28;
const GRID_ROWS = 18;

function CTGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cellW = W / GRID_COLS;
    const cellH = H / GRID_ROWS;

    // Generate grayscale CT-like grid values
    const cells: number[][] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      cells[r] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        // Create a kidney-ish oval shape in center-left
        const cx = GRID_COLS * 0.38, cy = GRID_ROWS * 0.5;
        const dx = (c - cx) / (GRID_COLS * 0.18);
        const dy = (r - cy) / (GRID_ROWS * 0.28);
        const dist = Math.sqrt(dx * dx + dy * dy);
        let val = 0;
        if (dist < 1) val = 0.15 + (1 - dist) * 0.35 + Math.random() * 0.08;
        else val = Math.random() * 0.06;
        cells[r][c] = val;
      }
    }

    // Stone highlight
    const stoneR = Math.floor(GRID_ROWS * 0.44);
    const stoneC = Math.floor(GRID_COLS * 0.41);
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (cells[stoneR + dr]?.[stoneC + dc] !== undefined) {
          cells[stoneR + dr][stoneC + dc] = 0.75 + Math.random() * 0.2;
        }
      }
    }

    let frame = 0;
    let animId: number;
    let scanLine = 0;
    let bboxOpacity = 0;
    let bboxVisible = false;

    function draw() {
      ctx!.clearRect(0, 0, W, H);

      // Draw cells
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const v = cells[r][c];
          const brightness = Math.floor(v * 220);
          ctx!.fillStyle = `rgb(${brightness},${brightness + 4},${brightness + 8})`;
          ctx!.fillRect(c * cellW + 1, r * cellH + 1, cellW - 1.5, cellH - 1.5);
        }
      }

      // Scan line effect
      if (frame < 80) {
        scanLine = (frame / 80) * H;
        ctx!.fillStyle = "rgba(56, 189, 248, 0.12)";
        ctx!.fillRect(0, scanLine - 3, W, 6);
        ctx!.fillStyle = "rgba(56, 189, 248, 0.06)";
        ctx!.fillRect(0, 0, W, scanLine);
      }

      // Bbox reveal after scan
      if (frame > 70) {
        bboxVisible = true;
        bboxOpacity = Math.min(1, (frame - 70) / 20);
      }

      if (bboxVisible) {
        const bx = (stoneC - 1.5) * cellW;
        const by = (stoneR - 1.5) * cellH;
        const bw = 4 * cellW;
        const bh = 4 * cellH;

        // Bbox corners
        const cornerLen = 8;
        ctx!.strokeStyle = `rgba(56,189,248,${bboxOpacity})`;
        ctx!.lineWidth = 1.5;

        // TL
        ctx!.beginPath(); ctx!.moveTo(bx, by + cornerLen); ctx!.lineTo(bx, by); ctx!.lineTo(bx + cornerLen, by); ctx!.stroke();
        // TR
        ctx!.beginPath(); ctx!.moveTo(bx + bw - cornerLen, by); ctx!.lineTo(bx + bw, by); ctx!.lineTo(bx + bw, by + cornerLen); ctx!.stroke();
        // BL
        ctx!.beginPath(); ctx!.moveTo(bx, by + bh - cornerLen); ctx!.lineTo(bx, by + bh); ctx!.lineTo(bx + cornerLen, by + bh); ctx!.stroke();
        // BR
        ctx!.beginPath(); ctx!.moveTo(bx + bw - cornerLen, by + bh); ctx!.lineTo(bx + bw, by + bh); ctx!.lineTo(bx + bw - cornerLen, by + bh); ctx!.stroke();

        // Confidence label
        if (bboxOpacity > 0.5) {
          ctx!.fillStyle = `rgba(56,189,248,${bboxOpacity})`;
          ctx!.font = `bold 9px monospace`;
          ctx!.fillText("stone  0.91", bx, by - 4);
        }

        // Segmentation mask dots
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const mx = (stoneC + dc) * cellW + cellW / 2;
            const my = (stoneR + dr) * cellH + cellH / 2;
            ctx!.beginPath();
            ctx!.arc(mx, my, 2, 0, Math.PI * 2);
            ctx!.fillStyle = `rgba(56,189,248,${bboxOpacity * 0.6})`;
            ctx!.fill();
          }
        }
      }

      frame++;
      if (frame < 160) {
        animId = requestAnimationFrame(draw);
      } else {
        // Hold final state, restart after delay
        setTimeout(() => {
          frame = 0;
          bboxOpacity = 0;
          bboxVisible = false;
          scanLine = 0;
          animId = requestAnimationFrame(draw);
        }, 2400);
      }
    }

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={420}
      height={270}
      className="rounded-lg opacity-90"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

interface HeroProps {
  onDemoClick?: () => void;
}

export default function Hero({ onDemoClick }: HeroProps) {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          opacity: 0.4,
        }}
      />

      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, var(--bg) 100%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12 py-24 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">

          {/* Left — Text */}
          <div className="flex-1 max-w-xl">
            {/* Badge */}
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="inline-flex items-center gap-2 mb-8"
            >
              <span
                className="text-xs font-mono tracking-widest uppercase px-3 py-1 rounded-full border"
                style={{
                  color: "var(--accent)",
                  borderColor: "var(--accent-border)",
                  background: "var(--accent-bg)",
                  letterSpacing: "0.12em",
                }}
              >
                Graduation Project · Kocaeli University
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mb-6 leading-tight"
              style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
                fontWeight: 400,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Kidney Stone
              <br />
              <span style={{ color: "var(--accent)" }}>Detection System</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mb-10 leading-relaxed"
              style={{
                fontSize: "1.05rem",
                color: "var(--text-secondary)",
                maxWidth: "38ch",
              }}
            >
              Deep learning–powered CT image analysis using YOLO26 segmentation
              and retrieval-augmented generation to produce automated radiology reports.
            </motion.p>

            {/* Stats row */}
            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex gap-8 mb-10"
            >
              {[
                { value: "81.3%", label: "mAP50" },
                { value: "YOLO26", label: "Architecture" },
                { value: "RAG", label: "Report Gen" },
              ].map((s) => (
                <div key={s.label}>
                  <p
                    style={{
                      fontFamily: "'DM Serif Display', Georgia, serif",
                      fontSize: "1.5rem",
                      color: "var(--text-primary)",
                      lineHeight: 1,
                      marginBottom: "4px",
                    }}
                  >
                    {s.value}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex gap-4 flex-wrap"
            >
              <button
                onClick={onDemoClick}
                className="cta-primary px-7 py-3 rounded-lg text-sm font-medium tracking-wide transition-all"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Try Live Demo
              </button>
              <button
                className="cta-secondary px-7 py-3 rounded-lg text-sm font-medium tracking-wide transition-all"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                View Pipeline ↓
              </button>
            </motion.div>
          </div>

          {/* Right — CT Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex-shrink-0 flex flex-col items-center gap-4"
          >
            {/* Frame */}
            <div
              className="relative p-1 rounded-xl"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--card-border)",
                boxShadow: "0 0 0 1px var(--card-border), 0 20px 60px rgba(0,0,0,0.3)",
              }}
            >
              {/* Header bar */}
              <div
                className="flex items-center gap-2 px-3 py-2 mb-1"
                style={{ borderBottom: "1px solid var(--card-border)" }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: "var(--accent)", opacity: 0.7 }} />
                <span className="text-xs font-mono" style={{ color: "var(--text-secondary)", fontSize: "10px" }}>
                  CT_SCAN_0042.dcm — analyzing
                </span>
                <span
                  className="ml-auto text-xs font-mono animate-pulse"
                  style={{ color: "var(--accent)", fontSize: "10px" }}
                >
                  ● LIVE
                </span>
              </div>

              <CTGrid />

              {/* Footer bar */}
              <div
                className="flex items-center justify-between px-3 py-2 mt-1"
                style={{ borderTop: "1px solid var(--card-border)" }}
              >
                <span className="text-xs font-mono" style={{ color: "var(--text-secondary)", fontSize: "10px" }}>
                  512×512 · Axial · KSSD2025
                </span>
                <span className="text-xs font-mono" style={{ color: "var(--accent)", fontSize: "10px" }}>
                  seg confidence: 0.91
                </span>
              </div>
            </div>

            {/* Model tag */}
            <p className="text-xs font-mono" style={{ color: "var(--text-secondary)", letterSpacing: "0.06em" }}>
              YOLO26-seg · bge-large-en-v1.5 · Gemini
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
