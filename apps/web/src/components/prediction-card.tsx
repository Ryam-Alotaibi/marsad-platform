"use client";

import { useState } from "react";
import type { Prediction } from "@/lib/api";
import { ROLE_LABELS_AR, ACTION_STATUS_LABELS_AR, type RoleKey } from "@marsad/shared";
import { ChevronDownIcon } from "@/components/stat-icons";
import { formatPredictionWindow } from "@/lib/format";
import { t } from "@/i18n/t";

const ACTION_STATUS_TONE: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning",
  IN_PROGRESS: "bg-brand/10 text-brand",
  DONE: "bg-success/10 text-success",
};

function confidenceTone(pct: number) {
  if (pct >= 75) return "bg-danger/10 text-danger";
  if (pct >= 50) return "bg-warning/10 text-warning";
  return "bg-info/10 text-info";
}

export function PredictionCard({ prediction }: { prediction: Prediction }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised shadow-card">
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-text-primary">{prediction.title}</h3>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${confidenceTone(prediction.confidencePct)}`}>
            {t("predictions.confidence")}: {prediction.confidencePct}%
          </span>
        </div>

        <p className="text-sm leading-relaxed text-text-secondary">
          <span className="font-medium text-text-primary">{t("predictions.rootCause")}: </span>
          {prediction.rootCause}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-tertiary">
          <span>{t("predictions.window")}: {formatPredictionWindow(prediction.windowStart, prediction.windowEnd)}</span>
          {prediction.siteName && <span>{prediction.siteName}</span>}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 self-start text-sm font-medium text-brand"
        >
          {t("predictions.actionsTitle")}
          <ChevronDownIcon className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border-subtle px-5 py-4">
          <ul className="flex flex-col gap-3">
            {prediction.actions.map((action) => (
              <li key={action.id} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="text-text-primary">{action.description}</p>
                  <p className="mt-0.5 text-xs text-text-tertiary">
                    {t("predictions.assignedTo")}:{" "}
                    {action.assignedUserName ??
                      (action.assignedRoleKey ? ROLE_LABELS_AR[action.assignedRoleKey as RoleKey] : "—")}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${ACTION_STATUS_TONE[action.status]}`}>
                  {ACTION_STATUS_LABELS_AR[action.status] ?? action.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
