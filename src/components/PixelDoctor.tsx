import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const HF_SPACE_URL = "https://CihanEmre-ModelsSpace.hf.space";

const MESSAGES = [
  "Model hazırlanıyor...",
  "Servis uyanıyor...",
  "Nöral ağ yükleniyor...",
  "Neredeyse hazır...",
];

interface PixelDoctorProps {
  onReady: () => void;
}

export default function PixelDoctor({ onReady }: PixelDoctorProps) {
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mesaj döngüsü
  useEffect(() => {
    const msg = setInterval(() => {
      setMsgIdx(i => (i + 1) % MESSAGES.length);
    }, 1800);
    return () => clearInterval(msg);
  }, []);

  // Health check + progress bar
  useEffect(() => {
    let prog = 0;
    intervalRef.current = setInterval(() => {
      prog += 1.5;
      setProgress(Math.min(prog, 95));
    }, 300);

    const ping = async () => {
  try {
    const [res] = await Promise.all([
      fetch(`${HF_SPACE_URL}/health`),
      new Promise(resolve => setTimeout(resolve, 2500))
    ]);
    if ((res as Response).ok) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(100);
      setMsgIdx(3);
      setTimeout(() => {
        setDone(true);
        setTimeout(onReady, 600);
      }, 800);
    } else {
      setTimeout(ping, 3000);
    }
  } catch {
    setTimeout(ping, 3000);
  }
};

    setTimeout(ping, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [onReady]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16, transition: { duration: 0.5 } }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2rem",
          }}
        >
          {/* Görseller */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "2.5rem" }}>
            {/* CT Makinesi */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <img
                src="/pixel-ct.png"
                alt="CT Scanner"
                style={{ width: "120px", imageRendering: "pixelated" }}
              />
              <p style={{
                fontFamily: "monospace",
                fontSize: "0.65rem",
                color: "var(--text-secondary)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}>
                CT Scanner
              </p>
            </div>

            {/* Radyolog */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <img
                src="/pixel-doctor.png"
                alt="Radiologist"
                style={{ width: "100px", imageRendering: "pixelated" }}
              />
              <p style={{
                fontFamily: "monospace",
                fontSize: "0.65rem",
                color: "var(--text-secondary)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}>
                AI Radiologist
              </p>
            </div>
          </div>

          {/* Mesaj */}
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIdx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                letterSpacing: "0.04em",
              }}
            >
              {MESSAGES[msgIdx]}
            </motion.p>
          </AnimatePresence>

          {/* Loading bar */}
          <div style={{
            width: "260px",
            height: "4px",
            background: "rgba(255,255,255,0.08)",
            borderRadius: "999px",
            overflow: "hidden",
          }}>
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{
                height: "100%",
                background: "var(--accent)",
                borderRadius: "999px",
              }}
            />
          </div>

          {/* Yüzde */}
          <p style={{
            fontFamily: "monospace",
            fontSize: "0.75rem",
            color: "var(--accent)",
            marginTop: "-1rem",
          }}>
            {Math.round(progress)}%
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
