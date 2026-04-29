import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PixelDoctor from "./PixelDoctor";

const HF_SPACE_URL = "https://CihanEmre-ModelsSpace.hf.space";

type Stage = "loading" | "upload" | "analyzing" | "result";

interface Detection {
  confidence: number;
  bbox: number[];
}

interface Result {
  has_stone: boolean;
  detections: Detection[];
  annotated_image: string;
  report: string;
}

export default function LiveDemo() {
  const [stage, setStage] = useState<Stage>("loading");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  }, []);

  const handleAnalyze = async () => {
    if (!file) return;
    setStage("analyzing");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${HF_SPACE_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Analiz başarısız oldu.");
      const data: Result = await res.json();
      setResult(data);
      setStage("result");
    } catch (err) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      setStage("upload");
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setStage("upload");
  };

  return (
    <section
      id="live-demo"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "6rem 1.5rem",
        gap: "3rem",
      }}
    >
      {/* Başlık */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{ textAlign: "center" }}
      >
        <p style={{
          fontFamily: "monospace",
          fontSize: "0.75rem",
          color: "var(--accent)",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: "1rem",
        }}>
          Live Demo
        </p>
        <h2 style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
          fontWeight: 400,
          color: "var(--text-primary)",
          letterSpacing: "-0.02em",
          marginBottom: "0.75rem",
        }}>
          Canlı Analiz
        </h2>
        <p style={{
          fontSize: "1rem",
          color: "var(--text-secondary)",
          maxWidth: "40ch",
          margin: "0 auto",
          lineHeight: 1.7,
        }}>
          CT görüntünüzü yükleyin, YOLO26-seg modeliyle analiz edin ve otomatik radyoloji raporu alın.
        </p>
      </motion.div>

      {/* Ana içerik */}
      <AnimatePresence mode="wait">

        {/* Loading */}
        {stage === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PixelDoctor onReady={() => setStage("upload")} />
          </motion.div>
        )}

        {/* Upload */}
        {stage === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              width: "100%",
              maxWidth: "520px",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => document.getElementById("ct-input")?.click()}
              style={{
                border: `1.5px dashed ${dragOver ? "var(--accent)" : "rgba(255,255,255,0.15)"}`,
                borderRadius: "12px",
                padding: "3rem 2rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem",
                cursor: "pointer",
                background: dragOver ? "rgba(56,189,248,0.04)" : "rgba(255,255,255,0.02)",
                transition: "all 0.2s ease",
              }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Önizleme"
                  style={{
                    maxHeight: "220px",
                    maxWidth: "100%",
                    borderRadius: "8px",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <>
                  {/* Upload ikonu */}
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textAlign: "center" }}>
                    CT görüntüsünü buraya sürükleyin<br />
                    <span style={{ color: "var(--accent)", fontSize: "0.85rem" }}>veya tıklayın</span>
                  </p>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", opacity: 0.6 }}>
                    PNG, JPG, JPEG · Maks 10MB
                  </p>
                </>
              )}
              <input
                id="ct-input"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>

            {/* Dosya adı */}
            {file && (
              <p style={{
                fontFamily: "monospace",
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                textAlign: "center",
              }}>
                {file.name}
              </p>
            )}

            {/* Hata */}
            {error && (
              <p style={{ color: "#f87171", fontSize: "0.85rem", textAlign: "center" }}>
                {error}
              </p>
            )}

            {/* Not */}
            <p style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              textAlign: "center",
              opacity: 0.6,
            }}>
              İlk analiz ~30 saniye sürebilir (model soğuk başlatma)
            </p>

            {/* Analiz butonu */}
            <button
              onClick={handleAnalyze}
              disabled={!file}
              style={{
                background: file ? "var(--accent)" : "rgba(255,255,255,0.06)",
                color: file ? "#0a0d12" : "var(--text-secondary)",
                border: "none",
                borderRadius: "8px",
                padding: "0.85rem",
                fontSize: "0.9rem",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                cursor: file ? "pointer" : "not-allowed",
                transition: "all 0.2s ease",
                letterSpacing: "0.02em",
              }}
            >
              Analiz Başlat
            </button>
          </motion.div>
        )}

        {/* Analyzing */}
        {stage === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.5rem",
            }}
          >
            <div style={{ display: "flex", gap: "6px" }}>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "var(--accent)",
                  }}
                />
              ))}
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontFamily: "'DM Sans', sans-serif" }}>
              Görüntü analiz ediliyor...
            </p>
            {preview && (
              <img
                src={preview}
                alt="Analiz ediliyor"
                style={{
                  maxHeight: "180px",
                  maxWidth: "320px",
                  borderRadius: "8px",
                  objectFit: "contain",
                  opacity: 0.5,
                  filter: "grayscale(30%)",
                }}
              />
            )}
          </motion.div>
        )}

        {/* Result */}
        {stage === "result" && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              width: "100%",
              maxWidth: "900px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2rem",
            }}
          >
            {/* Sol — Görüntü */}
            <div style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: "12px",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-secondary)", letterSpacing: "0.06em" }}>
                  ANNOTATED OUTPUT
                </p>
                <span style={{
                  background: result.has_stone ? "rgba(56,189,248,0.1)" : "rgba(74,222,128,0.1)",
                  color: result.has_stone ? "var(--accent)" : "#4ade80",
                  fontSize: "0.7rem",
                  fontFamily: "monospace",
                  padding: "2px 10px",
                  borderRadius: "999px",
                  border: `1px solid ${result.has_stone ? "rgba(56,189,248,0.25)" : "rgba(74,222,128,0.25)"}`,
                }}>
                  {result.has_stone ? `${Array.isArray(result.detections) ? result.detections.length : "1"} taş tespit edildi` : "Taş tespit edilmedi"}
                </span>
              </div>

              <img
                src={`data:image/png;base64,${result.annotated_image}`}
                alt="Annotated CT"
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  objectFit: "contain",
                  background: "#000",
                }}
              />

              {/* Detections */}
              {result.detections.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {result.detections.map((d, i) => (
                    <div key={i} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 10px",
                      background: "rgba(56,189,248,0.05)",
                      borderRadius: "6px",
                      border: "1px solid rgba(56,189,248,0.1)",
                    }}>
                      <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        Taş #{i + 1}
                      </span>
                      <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--accent)" }}>
                        {(d.confidence * 100).toFixed(1)}% güven
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sağ — Rapor */}
            <div style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: "12px",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}>
              <p style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-secondary)", letterSpacing: "0.06em" }}>
                RADIOLOGY REPORT
              </p>
              <div style={{
                flex: 1,
                fontSize: "0.88rem",
                color: "var(--text-primary)",
                lineHeight: 1.8,
                fontFamily: "'DM Sans', sans-serif",
                whiteSpace: "pre-wrap",
              }}>
                {result.report}
              </div>

              {/* Tekrar dene */}
              <button
                onClick={handleReset}
                style={{
                  background: "transparent",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--card-border)",
                  borderRadius: "8px",
                  padding: "0.7rem",
                  fontSize: "0.85rem",
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  marginTop: "auto",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--card-border)")}
              >
                Yeni Görüntü Yükle
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </section>
  );
}
