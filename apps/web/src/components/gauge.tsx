const STATUS_COLOR: Record<string, string> = {
  NORMAL: "var(--success-500)",
  WARNING: "var(--warning-500)",
  CRITICAL: "var(--danger-500)",
};

function arcPoint(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

export function Gauge({
  label,
  value,
  unit,
  max,
  status,
}: {
  label: string;
  value: number;
  unit: string;
  max: number;
  status: "NORMAL" | "WARNING" | "CRITICAL";
}) {
  const cx = 50;
  const cy = 52;
  const r = 38;
  const pct = Math.min(1, Math.max(0, value / max));
  const endAngle = 180 - pct * 180;

  const start = arcPoint(cx, cy, r, 180);
  const end = arcPoint(cx, cy, r, endAngle);
  const fullEnd = arcPoint(cx, cy, r, 0);
  const largeArc = pct > 0.5 ? 1 : 0;

  const trackPath = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${fullEnd.x} ${fullEnd.y}`;
  const valuePath = `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 62" className="w-full max-w-[140px]">
        <path d={trackPath} fill="none" stroke="var(--surface-border)" strokeWidth="8" strokeLinecap="round" />
        {pct > 0 && (
          <path d={valuePath} fill="none" stroke={STATUS_COLOR[status]} strokeWidth="8" strokeLinecap="round" />
        )}
        <text x="50" y="46" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--text-primary)">
          {value.toFixed(0)}
        </text>
        <text x="50" y="58" textAnchor="middle" fontSize="8" fill="var(--text-tertiary)">
          {unit}
        </text>
      </svg>
      <span className="mt-0.5 text-xs text-text-secondary">{label}</span>
    </div>
  );
}
