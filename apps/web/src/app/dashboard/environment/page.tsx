"use client";

import { useEffect, useState } from "react";
import { fetchEnvironment, type EnvironmentResponse } from "@/lib/api";
import { Topbar } from "@/components/topbar";

function riskTone(pct: number) {
  if (pct <= 30) return "success" as const;
  if (pct <= 60) return "warning" as const;
  return "danger" as const;
}

const TONE_BG: Record<string, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

const TONE_TEXT: Record<string, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

export default function EnvironmentPage() {
  const [data, setData] = useState<EnvironmentResponse | null>(null);

  useEffect(() => {
    fetchEnvironment().then(setData);
  }, []);

  return (
    <>
      <Topbar title="المخاطر البيئية" />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          {data && (
            <>
              <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-6 shadow-card">
                <p className="text-xs text-text-tertiary">المؤشر العام المركّب</p>
                <p className={`mt-1 text-4xl font-semibold ${TONE_TEXT[riskTone(data.compositeIndex)]}`}>
                  {data.compositeIndex}%
                </p>
              </section>

              <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
                <h2 className="mb-4 text-sm font-semibold text-text-primary">متوسط المخاطر حسب العامل</h2>
                <div className="flex items-end gap-6" style={{ height: 160 }}>
                  {data.factors.map((f) => (
                    <div key={f.key} className="flex flex-1 flex-col items-center gap-2">
                      <span className="text-xs font-medium text-text-primary">{f.riskPct}%</span>
                      <div className="flex w-full flex-1 items-end">
                        <div
                          className={`w-full rounded-t-[var(--radius-sm)] ${TONE_BG[riskTone(f.riskPct)]}`}
                          style={{ height: `${Math.max(4, f.riskPct)}%` }}
                        />
                      </div>
                      <span className="text-center text-xs text-text-tertiary">{f.labelAr}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {data.sites.map((s) => (
                  <div key={s.id} className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
                    <h3 className="mb-3 text-sm font-semibold text-text-primary">{s.name}</h3>
                    <dl className="grid grid-cols-2 gap-y-2 text-sm">
                      <dt className="text-text-tertiary">مؤشر جودة الهواء (AQI)</dt>
                      <dd className="text-end text-text-primary">{s.aqi?.toFixed(0) ?? "—"}</dd>
                      <dt className="text-text-tertiary">درجة الحرارة</dt>
                      <dd className="text-end text-text-primary">{s.temperatureC?.toFixed(1) ?? "—"}°</dd>
                      <dt className="text-text-tertiary">فعاليات مجدولة قادمة</dt>
                      <dd className="text-end text-text-primary">{s.scheduledEventsCount}</dd>
                    </dl>
                  </div>
                ))}
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
