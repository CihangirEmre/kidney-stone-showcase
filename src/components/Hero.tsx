import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CircularProgress from "./CircularProgress";

function KidneyDetection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;

    const W = 420, H = 270;
    const CELL = 12;
    const COLS = Math.ceil(W / CELL);
    const ROWS = Math.ceil(H / CELL);

    // ── Kidney anatomy
    const KCX = 170, KCY = 133;   // kidney center
    const KRX = 62,  KRY = 90;    // outer ellipse (portrait: taller than wide)
    const SX = 147, SY = 112, SR = 11; // stone (hyperdense lesion)

    // Angle-based bean shape: convex outer ellipse with deep hilum notch on right side.
    // Uses smooth trigonometric formula — guarantees a simple closed boundary (no T-junctions).
    function cellIsInside(px: number, py: number): boolean {
      const nx = (px - KCX) / KRX;
      const ny = (py - KCY) / KRY;
      const angle = Math.atan2(ny, nx);                       // -π..π; 0 = rightward
      const adRight = Math.min(Math.abs(angle), 2 * Math.PI - Math.abs(angle));
      let eff = 1.0;
      const SPREAD = 1.28;   // notch spans ±73° from right
      const DEPTH  = 0.52;   // 52 % depth at the rightmost point
      if (adRight < SPREAD) {
        const t = Math.pow(1 - adRight / SPREAD, 1.1);
        eff -= t * DEPTH;
      }
      return Math.sqrt(nx * nx + ny * ny) < eff;
    }

    // ── Build cell grid (used for both background and boundary trace)
    const grid: boolean[][] = Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, (_, c) =>
        cellIsInside(c * CELL + CELL / 2, r * CELL + CELL / 2)
      )
    );

    // ── CT Background
    const bgCanvas = document.createElement("canvas");
    bgCanvas.width = W; bgCanvas.height = H;
    const bgCtx = bgCanvas.getContext("2d")!;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const px = c * CELL + CELL / 2, py = r * CELL + CELL / 2;
        const inStone = Math.sqrt((px - SX) ** 2 + (py - SY) ** 2) < SR;
        let val: number;
        if (inStone)       val = 0.75 + Math.random() * 0.22;
        else if (grid[r][c]) val = 0.18 + Math.random() * 0.09;
        else               val = Math.random() * 0.05;
        const b = Math.floor(val * 230);
        bgCtx.fillStyle = `rgb(${b},${b + 3},${b + 6})`;
        bgCtx.fillRect(c * CELL, r * CELL, CELL - 1, CELL - 1);
      }
    }

    // ── Pixel-aligned boundary trace
    // Build adjacency graph: for each boundary edge between an inside
    // and outside cell, add an edge between the two cell-corner nodes.
    const adj = new Map<string, string[]>();
    const addEdge = (c1: number, r1: number, c2: number, r2: number) => {
      const k1 = `${c1},${r1}`, k2 = `${c2},${r2}`;
      if (!adj.has(k1)) adj.set(k1, []);
      if (!adj.has(k2)) adj.set(k2, []);
      adj.get(k1)!.push(k2);
      adj.get(k2)!.push(k1);
    };
    const cin = (r: number, c: number) =>
      r >= 0 && r < ROWS && c >= 0 && c < COLS && grid[r][c];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!grid[r][c]) continue;
        if (!cin(r - 1, c)) addEdge(c,     r,     c + 1, r);     // top edge
        if (!cin(r + 1, c)) addEdge(c,     r + 1, c + 1, r + 1); // bottom edge
        if (!cin(r, c - 1)) addEdge(c,     r,     c,     r + 1); // left edge
        if (!cin(r, c + 1)) addEdge(c + 1, r,     c + 1, r + 1); // right edge
      }
    }

    // Find topmost inside cell → walk boundary from its top-left corner
    let sC = 0, sR = 0;
    outer: for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c]) { sC = c; sR = r; break outer; }
      }
    }

    const segPath: [number, number][] = [];
    const startKey = `${sC},${sR}`;
    let cur = startKey, prev: string | null = null;
    const MAX_WALK = ROWS * COLS * 4;
    let walkIter = 0;
    do {
      const [cx, cy] = cur.split(",").map(Number);
      segPath.push([cx * CELL, cy * CELL]);
      const neighbors = adj.get(cur) ?? [];
      let next: string | null = null;
      for (const n of neighbors) {
        if (n !== prev) { next = n; break; }
      }
      if (!next) break;
      prev = cur;
      cur = next;
      if (++walkIter > MAX_WALK) break; // safety: prevent infinite loop
    } while (cur !== startKey);
    // Close the loop
    segPath.push(segPath[0]);

    const N = segPath.length;

    // ── Detection box
    const bx = SX - SR - 14, by = SY - SR - 12;
    const bw = (SR + 14) * 2,  bh = (SR + 12) * 2;

    // ── Helpers
    function drawCorners(
      x: number, y: number, w: number, h: number, alpha: number, len = 11
    ) {
      if (alpha <= 0) return;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ([[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]] as const)
        .forEach(([cx, cy, sx, sy]) => {
          ctx.beginPath();
          ctx.moveTo(cx, cy + sy * len);
          ctx.lineTo(cx, cy);
          ctx.lineTo(cx + sx * len, cy);
          ctx.stroke();
        });
      ctx.globalAlpha = 1;
    }

    function tag(text: string, x: number, y: number, alpha: number, small = false) {
      if (alpha <= 0) return;
      const fs = small ? 9 : 10;
      ctx.font = `bold ${fs}px monospace`;
      const tw = ctx.measureText(text).width;
      ctx.globalAlpha = Math.min(alpha * 0.85, 1);
      ctx.fillStyle = "rgba(8,11,16,0.9)";
      ctx.fillRect(x - 3, y - fs - 2, tw + 6, fs + 5);
      ctx.globalAlpha = Math.min(alpha, 1);
      ctx.fillStyle = "#38bdf8";
      ctx.fillText(text, x, y);
      ctx.globalAlpha = 1;
    }

    function ease(t: number) {
      return 1 - Math.pow(Math.max(0, 1 - Math.min(t, 1)), 3);
    }

    function clamp01(t: number) {
      return Math.max(0, Math.min(1, t));
    }

    // ── Animation phase boundaries (frames at ~60 fps)
    // Cycle: BG fade → seg grows → labels/box appear → HOLD →
    //        labels/box fade out → seg erases from start → restart
    const P_BG_END   = 20;   // CT background fully visible
    const P_SEG_DONE = 75;   // segmentation outline complete   (55 frames to grow)
    const P_KL_IN    = 90;   // "kidney seg" label visible
    const P_DET_IN   = 130;  // detection box fully in
    const P_STL_IN   = 152;  // "stone conf=0.91" label visible
    const P_HOLD_END = 215;  // hold phase ends
    const P_FADE_END = 235;  // stone label + det box faded out
    const P_KL_OUT   = 250;  // "kidney seg" label faded out → erase starts
    const P_ERASE_END = 305; // seg fully erased          (55 frames, same as grow)
    const CYCLE      = 320;  // restart (brief dark pause)

    let frame = 0;
    let firstCycle = true;
    let animId: number;

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // ── CT background (fade-in only on first cycle)
      ctx.globalAlpha = firstCycle ? ease(frame / P_BG_END) : 1;
      ctx.drawImage(bgCanvas, 0, 0);
      ctx.globalAlpha = 1;

      // Scan line — first cycle only
      if (firstCycle && frame < P_BG_END) {
        const sl = (frame / P_BG_END) * H;
        ctx.fillStyle = "rgba(56,189,248,0.10)";
        ctx.fillRect(0, sl - 3, W, 6);
        ctx.fillStyle = "rgba(56,189,248,0.04)";
        ctx.fillRect(0, 0, W, sl);
      }

      const dashOff = (frame * 0.3) % 8;

      // ── Segmentation draw/erase indices
      // "drawEnd" is how many seg points are currently visible from the front.
      // "eraseStart" is how many have been erased from the front.
      // Visible segment: [eraseStart, drawEnd]
      let drawEnd = 0, eraseStart = 0;

      if (frame < P_BG_END) {
        drawEnd = 0;
      } else if (frame < P_SEG_DONE) {
        drawEnd = Math.floor(ease((frame - P_BG_END) / (P_SEG_DONE - P_BG_END)) * N);
      } else if (frame < P_KL_OUT) {
        drawEnd = N;
      } else if (frame < P_ERASE_END) {
        // Erase from the start (same direction as draw)
        drawEnd = N;
        eraseStart = Math.floor(ease((frame - P_KL_OUT) / (P_ERASE_END - P_KL_OUT)) * N);
      } else {
        drawEnd = 0; eraseStart = 0;
      }

      // Draw the visible segment of the boundary
      if (drawEnd > eraseStart && eraseStart < N) {
        const fullyDrawn = drawEnd >= N && eraseStart === 0;

        // Filled polygon only when the outline is complete and not yet erasing
        if (fullyDrawn) {
          ctx.globalAlpha = 0.07;
          ctx.fillStyle = "#38bdf8";
          ctx.beginPath();
          segPath.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        // Outline (marching ants along cell edges)
        ctx.globalAlpha = 0.92;
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.lineDashOffset = -dashOff;
        ctx.beginPath();
        const end = Math.min(drawEnd, N - 1);
        for (let i = eraseStart; i <= end; i++) {
          const [px, py] = segPath[i];
          i === eraseStart ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
        ctx.globalAlpha = 1;
      }

      // ── "kidney  seg" label
      let kAlpha = 0;
      if (frame >= P_KL_IN && frame < P_HOLD_END)
        kAlpha = ease(clamp01((frame - P_KL_IN) / 15));
      else if (frame >= P_HOLD_END && frame < P_FADE_END)
        kAlpha = 1;
      else if (frame >= P_FADE_END && frame < P_KL_OUT)
        kAlpha = 1 - ease(clamp01((frame - P_FADE_END) / (P_KL_OUT - P_FADE_END)));
      tag("kidney  seg", KCX - KRX - 4, KCY - KRY + 8, kAlpha, true);

      // ── Detection box corners
      let boxAlpha = 0;
      if (frame >= P_DET_IN - 40 && frame < P_DET_IN)
        boxAlpha = ease(clamp01((frame - (P_DET_IN - 40)) / 40));
      else if (frame >= P_DET_IN && frame < P_HOLD_END)
        boxAlpha = 1;
      else if (frame >= P_HOLD_END && frame < P_FADE_END)
        boxAlpha = 1 - ease(clamp01((frame - P_HOLD_END) / (P_FADE_END - P_HOLD_END)));
      drawCorners(bx, by, bw, bh, boxAlpha);
      if (boxAlpha > 0) {
        ctx.globalAlpha = boxAlpha * 0.07;
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(bx, by, bw, bh);
        ctx.globalAlpha = 1;
      }

      // ── "stone  conf=0.91" label
      let sAlpha = 0;
      if (frame >= P_STL_IN && frame < P_HOLD_END)
        sAlpha = ease(clamp01((frame - P_STL_IN) / 20));
      else if (frame >= P_HOLD_END && frame < P_FADE_END)
        sAlpha = 1 - ease(clamp01((frame - P_HOLD_END) / (P_FADE_END - P_HOLD_END)));
      tag("stone  conf=0.91", bx, by - 5, sAlpha);

      // ── Advance frame, loop endlessly
      frame = (frame + 1) % CYCLE;
      if (frame === 0) firstCycle = false;

      animId = requestAnimationFrame(draw);
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
  loadingProgress: number;
  loadingMessage: string;
  modelReady: boolean;
}

export default function Hero({ onDemoClick, loadingProgress, loadingMessage, modelReady }: HeroProps) {
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

            {/* Model status card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.5 }}
              style={{
                marginTop: "1.5rem",
                background: "var(--card-bg)",
                border: `1px solid ${modelReady ? "rgba(74,222,128,0.2)" : "var(--card-border)"}`,
                borderRadius: "10px",
                padding: "0.85rem 1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                maxWidth: "340px",
                transition: "border-color 0.4s ease",
              }}
            >
              <AnimatePresence mode="wait">
                {!modelReady ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.25 } }}
                    style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                  >
                    <CircularProgress
                      progress={loadingProgress}
                      size={40}
                      strokeWidth={3}
                      showPercent={false}
                    />
                    <div>
                      <p style={{
                        fontFamily: "monospace",
                        fontSize: "0.58rem",
                        color: "var(--text-secondary)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        marginBottom: "3px",
                        opacity: 0.65,
                      }}>
                        Model Status
                      </p>
                      <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.85rem",
                        color: "var(--text-primary)",
                        marginBottom: "2px",
                      }}>
                        {loadingMessage}
                      </p>
                      <p style={{
                        fontFamily: "monospace",
                        fontSize: "0.62rem",
                        color: "var(--text-secondary)",
                        opacity: 0.55,
                      }}>
                        YOLO26-seg warm start
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="ready"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                  >
                    <span style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "rgba(74,222,128,0.1)",
                      border: "1px solid rgba(74,222,128,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <div>
                      <p style={{
                        fontFamily: "monospace",
                        fontSize: "0.58rem",
                        color: "var(--text-secondary)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        marginBottom: "3px",
                        opacity: 0.65,
                      }}>
                        Model Status
                      </p>
                      <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.85rem",
                        color: "#4ade80",
                        marginBottom: "2px",
                      }}>
                        Model is ready
                      </p>
                      <p style={{
                        fontFamily: "monospace",
                        fontSize: "0.62rem",
                        color: "var(--text-secondary)",
                        opacity: 0.55,
                      }}>
                        YOLO26-seg · online
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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

              <KidneyDetection />

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
