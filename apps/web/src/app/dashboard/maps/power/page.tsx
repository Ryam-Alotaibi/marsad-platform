"use client";

import { useEffect, useState } from "react";
import { fetchPowerMap, fetchPowerCurve, type PowerSite, type PowerCurvePoint } from "@/lib/api";
import { MapPageShell } from "@/components/map-page-shell";
import { LeafletMapDynamic } from "@/components/leaflet-map-dynamic";
import { LoadCurveChart } from "@/components/load-curve-chart";

function loadColor(loadPct: number): string {
  if (loadPct >= 90) return "#dd3f4f";
  if (loadPct >= 80) return "#d68a1f";
  return "#1f9d6b";
}

export default function PowerMapPage() {
  const [sites, setSites] = useState<PowerSite[] | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [curve, setCurve] = useState<PowerCurvePoint[] | null>(null);

  useEffect(() => {
    fetchPowerMap().then((data) => {
      setSites(data);
      if (data.length > 0) setSelectedSiteId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedSiteId) return;
    fetchPowerCurve(selectedSiteId).then(setCurve);
  }, [selectedSiteId]);

  return (
    <MapPageShell>
      {sites && (
        <LeafletMapDynamic
          markers={sites.map((s) => ({
            id: s.id,
            lat: s.latitude ?? 0,
            lng: s.longitude ?? 0,
            color: loadColor(s.loadPct),
            title: s.name,
            subtitle: `الحمل: ${s.loadPct}%`,
          }))}
        />
      )}

      <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-text-primary">منحنى الحمل خلال 24 ساعة</h2>
          <div className="flex flex-wrap gap-1.5">
            {sites?.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSiteId(s.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  s.id === selectedSiteId
                    ? "bg-brand text-white"
                    : "bg-sunken text-text-secondary hover:text-text-primary"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
        {curve && <LoadCurveChart points={curve} />}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sites?.map((s) => (
          <div key={s.id} className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">{s.name}</h3>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-text-tertiary">الحمل الحالي</dt>
              <dd className="text-end text-text-primary" dir="ltr">
                {s.currentLoadKw?.toFixed(0)} / {s.maxCapacityKw?.toFixed(0)} kW
              </dd>
              <dt className="text-text-tertiary">نسبة الحمل</dt>
              <dd className="text-end font-medium" style={{ color: loadColor(s.loadPct) }}>
                {s.loadPct}%
              </dd>
              <dt className="text-text-tertiary">وقود المولد الاحتياطي</dt>
              <dd className="text-end text-text-primary">{s.generatorFuelPct?.toFixed(0)}%</dd>
              <dt className="text-text-tertiary">شحن UPS</dt>
              <dd className="text-end text-text-primary">{s.upsChargePct?.toFixed(0)}%</dd>
              <dt className="text-text-tertiary">الفولت</dt>
              <dd className="text-end text-text-primary" dir="ltr">{s.voltage?.toFixed(0)} V</dd>
            </dl>
          </div>
        ))}
      </section>

      <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
        <h2 className="mb-2 text-sm font-semibold text-text-primary">جدول الصيانة والتوسعات القادمة</h2>
        <p className="text-sm text-text-tertiary">لا توجد صيانة أو توسعات مجدولة حاليًا.</p>
      </section>
    </MapPageShell>
  );
}
