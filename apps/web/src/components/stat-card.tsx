import type { ReactElement } from "react";

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactElement;
  tone?: "brand" | "success" | "warning" | "danger";
}

const TONE_CLASSES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  brand: "bg-brand/10 text-brand",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
};

export function StatCard({ label, value, icon, tone = "brand" }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${TONE_CLASSES[tone]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold text-text-primary">{value}</p>
        <p className="text-xs text-text-tertiary">{label}</p>
      </div>
    </div>
  );
}
