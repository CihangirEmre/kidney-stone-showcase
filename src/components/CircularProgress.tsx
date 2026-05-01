interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  showPercent?: boolean;
}

export default function CircularProgress({
  progress,
  size = 80,
  strokeWidth = 3,
  showPercent = true,
}: CircularProgressProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(progress, 100) / 100);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.35s ease" }}
        />
      </svg>
      {showPercent && (
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{
            fontFamily: "monospace",
            fontSize: `${Math.max(9, Math.round(size * 0.17))}px`,
            color: "var(--accent)",
            lineHeight: 1,
          }}>
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
}
