import type { PowerCurvePoint } from "@/lib/api";

const WIDTH = 640;
const HEIGHT = 180;
const PAD = 28;

export function LoadCurveChart({ points }: { points: PowerCurvePoint[] }) {
  if (points.length === 0) {
    return <p className="py-8 text-center text-sm text-text-tertiary">لا توجد قراءات كافية بعد</p>;
  }

  const maxY = Math.max(100, ...points.map((p) => p.loadPct));
  const xStep = (WIDTH - PAD * 2) / Math.max(1, points.length - 1);
  const yFor = (val: number) => HEIGHT - PAD - (val / maxY) * (HEIGHT - PAD * 2);
  const xFor = (i: number) => PAD + i * xStep;

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${xFor(i).toFixed(1)},${yFor(p.loadPct).toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="منحنى الحمل الكهربائي خلال 24 ساعة">
      <line x1={PAD} y1={yFor(80)} x2={WIDTH - PAD} y2={yFor(80)} stroke="var(--warning-500)" strokeDasharray="4 4" strokeWidth="1" />
      <line x1={PAD} y1={yFor(90)} x2={WIDTH - PAD} y2={yFor(90)} stroke="var(--danger-500)" strokeDasharray="4 4" strokeWidth="1" />
      <text x={WIDTH - PAD} y={yFor(80) - 4} textAnchor="end" fontSize="10" fill="var(--warning-500)">80%</text>
      <text x={WIDTH - PAD} y={yFor(90) - 4} textAnchor="end" fontSize="10" fill="var(--danger-500)">90%</text>
      <path d={path} fill="none" stroke="var(--brand-primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={p.recordedAt} cx={xFor(i)} cy={yFor(p.loadPct)} r="2.5" fill="var(--brand-primary)" />
      ))}
    </svg>
  );
}
