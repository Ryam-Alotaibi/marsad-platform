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
    <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-3.5 shadow-card sm:gap-4 sm:p-5">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] sm:h-11 sm:w-11 ${TONE_CLASSES[tone]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold text-text-primary sm:text-2xl">{value}</p>
        <p className="truncate text-xs text-text-tertiary">{label}</p>
      </div>
    </div>
  );
}
