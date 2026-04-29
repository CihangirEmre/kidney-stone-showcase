import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const LINKS = [
  { label: "Home", href: "#hero" },
  { label: "Full Pipeline", href: "#full-pipeline" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2.5rem",
        height: "60px",
        background: scrolled ? "rgba(10,13,18,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition: "all 0.3s ease",
      }}
    >
      {/* Logo */}
      <button
        onClick={() => scrollTo("#hero")}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <span style={{
          width: "28px",
          height: "28px",
          borderRadius: "6px",
          background: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a0d12" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="9"/>
            <path d="M9 9h.01M15 9h.01M9 15h6"/>
          </svg>
        </span>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.9rem",
          fontWeight: 500,
          color: "var(--text-primary)",
          letterSpacing: "-0.01em",
        }}>
          KSD System
        </span>
      </button>

      {/* Links */}
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        {LINKS.map((link) => (
          <button
            key={link.href}
            onClick={() => scrollTo(link.href)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: "0.02em",
              transition: "color 0.2s",
              padding: "4px 0",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            {link.label}
          </button>
        ))}

        {/* CTA */}
        <button
          onClick={() => scrollTo("#live-demo")}
          style={{
            background: "var(--accent)",
            color: "#0a0d12",
            border: "none",
            borderRadius: "6px",
            padding: "6px 16px",
            fontSize: "0.82rem",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#7dd3fc")}
          onMouseLeave={e => (e.currentTarget.style.background = "var(--accent)")}
        >
          Try Demo
        </button>
      </div>
    </motion.nav>
  );
}
