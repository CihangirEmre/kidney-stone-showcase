import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { label: "Overview", href: "#hero" },
  { label: "Methodology", href: "#methodology" },
  { label: "Pipeline", href: "#full-pipeline" },
  { label: "Results", href: "#results" },
  { label: "Live Demo", href: "#live-demo" },
];

const ACTIVE_SECTIONS = ["hero", "live-demo"];

export default function Sidebar() {
  const [active, setActive] = useState("#hero");

  useEffect(() => {
    const onScroll = () => {
      for (let i = ACTIVE_SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(ACTIVE_SECTIONS[i]);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.55) {
          setActive(`#${ACTIVE_SECTIONS[i]}`);
          return;
        }
      }
      setActive("#hero");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="sidebar"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: "var(--sidebar-width)",
        background: "#070a0f",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        zIndex: 40,
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <div style={{
        padding: "1.5rem 1.25rem",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <span style={{
            width: "28px",
            height: "28px",
            borderRadius: "6px",
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a0d12" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M9 9h.01M15 9h.01M9 15h6" />
            </svg>
          </span>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.88rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
          }}>
            KSD System
          </span>
        </div>
        <p style={{
          fontFamily: "monospace",
          fontSize: "0.58rem",
          color: "var(--text-secondary)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          paddingLeft: "38px",
          opacity: 0.65,
        }}>
          Graduation Project
        </p>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, paddingTop: "0.75rem", paddingBottom: "0.75rem" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.href;
          return (
            <button
              key={item.href}
              onClick={() => scrollTo(item.href)}
              style={{
                display: "block",
                width: "100%",
                padding: "0.55rem 1.25rem",
                background: isActive ? "rgba(56,189,248,0.05)" : "none",
                border: "none",
                borderLeft: `2px solid ${isActive ? "var(--accent)" : "transparent"}`,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "none";
              }}
            >
              <span style={{
                fontSize: "0.82rem",
                fontFamily: "'DM Sans', sans-serif",
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                fontWeight: isActive ? 500 : 400,
                transition: "color 0.2s",
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Author info */}
      <div style={{
        padding: "1.25rem",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        flexShrink: 0,
      }}>
        {[
          { label: "AUTHOR", value: "Cihan Emre" },
          { label: "INSTITUTION", value: "Kocaeli University" },
          { label: "YEAR", value: "2025" },
        ].map(({ label, value }) => (
          <div key={label}>
            <p style={{
              fontFamily: "monospace",
              fontSize: "0.57rem",
              color: "var(--text-secondary)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "2px",
              opacity: 0.55,
            }}>
              {label}
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.78rem",
              color: "var(--text-primary)",
            }}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </motion.aside>
  );
}
