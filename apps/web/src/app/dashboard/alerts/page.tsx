"use client";

import { useEffect, useState } from "react";
import { fetchAlerts, fetchRiskFactors, type Alert, type RiskFactorBreakdown } from "@/lib/api";
import { Topbar } from "@/components/topbar";
import {
  ALERT_CATEGORY_LABELS_AR,
  ALERT_SEVERITY_LABELS_AR,
  ALERT_STATUS_LABELS_AR,
  RISK_FACTOR_LABELS_AR,
} from "@marsad/shared";
import { formatDateTime } from "@/lib/format";
import { t } from "@/i18n/t";

const SEVERITY_TONE: Record<string, string> = {
  CRITICAL: "bg-danger/10 text-danger",
  WARNING: "bg-warning/10 text-warning",
  INFO: "bg-info/10 text-info",
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [riskFactors, setRiskFactors] = useState<RiskFactorBreakdown[] | null>(null);

  useEffect(() => {
    fetchAlerts().then(setAlerts);
    fetchRiskFactors().then(setRiskFactors);
  }, []);

  return (
    <>
      <Topbar title={t("alerts.title")} />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-text-primary">{t("alerts.alertsSection")}</h2>
            <div className="flex flex-col gap-3">
              {alerts && alerts.length === 0 && (
                <p className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-6 text-center text-sm text-text-tertiary shadow-card">
                  {t("alerts.empty")}
                </p>
              )}
              {alerts?.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between gap-4 rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-4 shadow-card"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SEVERITY_TONE[alert.severity]}`}>
                        {ALERT_SEVERITY_LABELS_AR[alert.severity] ?? alert.severity}
                      </span>
                      <span className="text-xs text-text-tertiary">
                        {ALERT_CATEGORY_LABELS_AR[alert.category] ?? alert.category}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-text-primary">{alert.title}</p>
                    <p className="text-sm text-text-secondary">{alert.description}</p>
                    <p className="text-xs text-text-tertiary">
                      {alert.siteName} · {formatDateTime(alert.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-sunken px-2.5 py-1 text-xs font-medium text-text-secondary">
                    {ALERT_STATUS_LABELS_AR[alert.status] ?? alert.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
            <h2 className="text-sm font-semibold text-text-primary">{t("alerts.riskSection")}</h2>
            {riskFactors && riskFactors.length === 0 && (
              <p className="mt-3 text-sm text-text-tertiary">{t("alerts.riskEmpty")}</p>
            )}
            <ul className="mt-4 flex flex-col gap-4">
              {riskFactors?.map((rf) => (
                <li key={rf.factorType}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-text-primary">{RISK_FACTOR_LABELS_AR[rf.factorType] ?? rf.factorType}</span>
                    <span className="font-medium text-text-primary">{rf.averageScore}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-sunken">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, rf.averageScore)}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-text-tertiary">
                    الوزن النسبي: {Math.round(rf.weight * 100)}% · عدد القراءات: {rf.sampleCount}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}
