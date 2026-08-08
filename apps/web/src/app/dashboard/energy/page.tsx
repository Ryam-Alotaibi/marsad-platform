"use client";

import { useEffect, useState } from "react";
import {
  fetchEnergy,
  turnOffAc,
  enableNightRationing,
  toggleSchedule,
  type EnergyResponse,
} from "@/lib/api";
import { Topbar } from "@/components/topbar";
import { DEVICE_CATEGORY_LABELS_AR } from "@marsad/shared";
import { EnergyIcon } from "@/components/nav-icons";

export default function EnergyPage() {
  const [data, setData] = useState<EnergyResponse | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    fetchEnergy().then(setData);
  }, []);

  async function runAction(key: string, action: () => Promise<EnergyResponse>) {
    setPending(key);
    try {
      const updated = await action();
      setData(updated);
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <Topbar title="ترشيد الطاقة" />
      <main className="flex-1 px-4 py-5 sm:px-6 sm:py-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          {data && (
            <>
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
                  <p className="text-xs text-text-tertiary">الاستهلاك الحالي</p>
                  <p className="mt-1 text-3xl font-semibold text-text-primary" dir="ltr">
                    {data.consumptionSummary.totalConsumptionKw} kW
                  </p>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
                  <p className="text-xs text-text-tertiary">التوفير الفعلي</p>
                  <p className="mt-1 text-3xl font-semibold text-success" dir="ltr">
                    {data.consumptionSummary.totalSavingsKw} kW
                  </p>
                </div>
              </section>

              <section className="flex flex-wrap gap-3">
                <button
                  onClick={() => runAction("ac", () => turnOffAc())}
                  disabled={pending !== null}
                  className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-card transition-all hover:brightness-110 disabled:opacity-60"
                >
                  <EnergyIcon className="h-4 w-4" />
                  {pending === "ac" ? "جارٍ التنفيذ..." : "إيقاف كل التكييف الآن"}
                </button>
                <button
                  onClick={() => runAction("night", () => enableNightRationing())}
                  disabled={pending !== null}
                  className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border-subtle bg-raised px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-brand/50 disabled:opacity-60"
                >
                  {pending === "night" ? "جارٍ التنفيذ..." : "تفعيل الترشيد الليلي"}
                </button>
              </section>

              <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
                <h2 className="mb-4 text-sm font-semibold text-text-primary">الأجهزة حسب الفئة</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle text-start text-xs text-text-tertiary">
                        <th className="pb-2 text-start font-medium">الموقع</th>
                        <th className="pb-2 text-start font-medium">الفئة</th>
                        <th className="pb-2 text-start font-medium">نشط</th>
                        <th className="pb-2 text-start font-medium">متوقف</th>
                        <th className="pb-2 text-start font-medium">مجدول</th>
                        <th className="pb-2 text-start font-medium">الاستهلاك</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.deviceCategories.map((dc) => (
                        <tr key={dc.id} className="border-b border-border-subtle last:border-0">
                          <td className="py-2.5 text-text-secondary">{dc.siteName}</td>
                          <td className="py-2.5 font-medium text-text-primary">
                            {DEVICE_CATEGORY_LABELS_AR[dc.category] ?? dc.category}
                          </td>
                          <td className="py-2.5 text-text-secondary" dir="ltr">{dc.activeCount}</td>
                          <td className="py-2.5 text-text-secondary" dir="ltr">{dc.offCount}</td>
                          <td className="py-2.5 text-text-secondary" dir="ltr">{dc.scheduledCount}</td>
                          <td className="py-2.5 text-text-secondary" dir="ltr">{dc.consumptionKw} kW</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
                <h2 className="mb-4 text-sm font-semibold text-text-primary">الجدولة الزمنية للإيقاف التلقائي</h2>
                <ul className="flex flex-col gap-3">
                  {data.schedules.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {s.name} — {s.siteName}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {s.timeOfDay} · {s.actionDescription} · توفير متوقع {s.expectedSavingsPct}%
                        </p>
                      </div>
                      <button
                        onClick={() => runAction(s.id, () => toggleSchedule(s.id))}
                        disabled={pending !== null}
                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                          s.isActive ? "bg-success/10 text-success" : "bg-sunken text-text-tertiary"
                        }`}
                      >
                        {s.isActive ? "مُفعّل" : "متوقف"}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
