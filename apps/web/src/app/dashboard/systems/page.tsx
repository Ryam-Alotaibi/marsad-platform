"use client";

import { useEffect, useState } from "react";
import { fetchSystems, type SystemComponentRow } from "@/lib/api";
import { Topbar } from "@/components/topbar";
import { SYSTEM_CATEGORY_LABELS_AR, SYSTEM_STATUS_LABELS_AR } from "@marsad/shared";

const STATUS_TONE: Record<string, string> = {
  ACTIVE: "bg-success/10 text-success",
  WARNING: "bg-warning/10 text-warning",
  DOWN: "bg-danger/10 text-danger",
};

const STATUS_DOT: Record<string, string> = {
  ACTIVE: "bg-success",
  WARNING: "bg-warning",
  DOWN: "bg-danger",
};

export default function SystemsPage() {
  const [systems, setSystems] = useState<SystemComponentRow[] | null>(null);

  useEffect(() => {
    fetchSystems().then(setSystems);
  }, []);

  const grouped = systems?.reduce<Record<string, SystemComponentRow[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    <>
      <Topbar title="لوحة التحكم التفصيلية" />
      <main className="flex-1 px-4 py-5 sm:px-6 sm:py-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {grouped &&
            Object.entries(grouped).map(([category, items]) => (
              <section key={category} className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
                <h2 className="mb-4 text-sm font-semibold text-text-primary">
                  {SYSTEM_CATEGORY_LABELS_AR[category] ?? category}
                </h2>
                <ul className="flex flex-col gap-3">
                  {items.map((s) => (
                    <li key={s.id} className="flex items-center gap-3">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[s.status]}`} />
                      <span className="flex-1 text-sm text-text-primary">{s.name}</span>
                      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-sunken">
                        <div
                          className={`h-full rounded-full ${STATUS_DOT[s.status]}`}
                          style={{ width: `${Math.min(100, s.loadPct)}%` }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-end text-xs text-text-tertiary" dir="ltr">
                        {s.loadPct}%
                      </span>
                      <span className={`w-16 shrink-0 rounded-full px-2 py-0.5 text-center text-[11px] font-medium ${STATUS_TONE[s.status]}`}>
                        {SYSTEM_STATUS_LABELS_AR[s.status] ?? s.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      </main>
    </>
  );
}
