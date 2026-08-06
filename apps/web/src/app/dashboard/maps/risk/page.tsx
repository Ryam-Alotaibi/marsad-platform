"use client";

import { useEffect, useState } from "react";
import { fetchRiskMap, type RiskSite } from "@/lib/api";
import { MapPageShell } from "@/components/map-page-shell";
import { LeafletMapDynamic } from "@/components/leaflet-map-dynamic";

function riskColor(pct: number): string {
  if (pct >= 70) return "#dd3f4f";
  if (pct >= 50) return "#d68a1f";
  if (pct >= 30) return "#e3b341";
  return "#1f9d6b";
}

export default function RiskMapPage() {
  const [sites, setSites] = useState<RiskSite[] | null>(null);

  useEffect(() => {
    fetchRiskMap().then(setSites);
  }, []);

  return (
    <MapPageShell>
      {sites && (
        <LeafletMapDynamic
          markers={sites.map((s) => ({
            id: s.id,
            lat: s.latitude ?? 0,
            lng: s.longitude ?? 0,
            color: riskColor(s.riskScorePct),
            title: s.name,
            subtitle: `درجة الخطورة: ${s.riskScorePct}%`,
          }))}
        />
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sites?.map((s) => (
          <div key={s.id} className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">{s.name}</h3>
              <span
                className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
                style={{ background: riskColor(s.riskScorePct) }}
              >
                {s.riskScorePct}%
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-text-tertiary">عمر البنية التحتية</dt>
              <dd className="text-end text-text-primary">{s.infrastructureAgeYears} سنة</dd>
              <dt className="text-text-tertiary">عدد الأعطال التاريخية</dt>
              <dd className="text-end text-text-primary">{s.historicalIncidentCount}</dd>
              <dt className="text-text-tertiary">درجة الحرارة الحالية</dt>
              <dd className="text-end text-text-primary">{s.currentTempC?.toFixed(1) ?? "—"}°</dd>
            </dl>
          </div>
        ))}
      </section>
    </MapPageShell>
  );
}
