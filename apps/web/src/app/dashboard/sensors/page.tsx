"use client";

import { useEffect, useState } from "react";
import { fetchIotOverview, type IotOverview } from "@/lib/api";
import { Topbar } from "@/components/topbar";
import { LeafletMapDynamic } from "@/components/leaflet-map-dynamic";
import { Gauge } from "@/components/gauge";
import { SENSOR_TYPE_LABELS_AR, IOT_STATUS_LABELS_AR } from "@marsad/shared";

const STATUS_TONE: Record<string, string> = {
  NORMAL: "bg-success/10 text-success",
  WARNING: "bg-warning/10 text-warning",
  CRITICAL: "bg-danger/10 text-danger",
};

const STATUS_COLOR: Record<string, string> = {
  NORMAL: "#1f9d6b",
  WARNING: "#d68a1f",
  CRITICAL: "#dd3f4f",
};

const SENSOR_MAX: Record<string, number> = {
  TEMPERATURE: 50,
  HUMIDITY: 100,
  AQI: 200,
  CO2: 2000,
  WATER_LEAK: 100,
  LIGHT: 1000,
};

const SENSOR_ORDER = ["TEMPERATURE", "HUMIDITY", "AQI", "CO2", "WATER_LEAK", "LIGHT"];

export default function SensorsPage() {
  const [data, setData] = useState<IotOverview | null>(null);

  useEffect(() => {
    fetchIotOverview().then(setData);
  }, []);

  return (
    <>
      <Topbar title="مستشعرات IoT" />
      <main className="flex-1 px-4 py-5 sm:px-6 sm:py-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          {data && (
            <>
              <section className="grid grid-cols-3 gap-4">
                <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-4 text-center shadow-card">
                  <p className="text-2xl font-semibold text-danger">{data.summary.critical}</p>
                  <p className="text-xs text-text-tertiary">حرج</p>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-4 text-center shadow-card">
                  <p className="text-2xl font-semibold text-warning">{data.summary.warning}</p>
                  <p className="text-xs text-text-tertiary">تحذير</p>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-4 text-center shadow-card">
                  <p className="text-2xl font-semibold text-success">{data.summary.normal}</p>
                  <p className="text-xs text-text-tertiary">طبيعي</p>
                </div>
              </section>

              <LeafletMapDynamic
                markers={data.sites.map((s) => ({
                  id: s.id,
                  lat: s.latitude ?? 0,
                  lng: s.longitude ?? 0,
                  color: STATUS_COLOR[s.status],
                  title: s.name,
                  subtitle: IOT_STATUS_LABELS_AR[s.status],
                }))}
              />

              <section className="flex flex-col gap-4">
                {data.sites.map((site) => (
                  <div key={site.id} className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-text-primary">{site.name}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_TONE[site.status]}`}>
                        {IOT_STATUS_LABELS_AR[site.status]}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                      {SENSOR_ORDER.map((type) => {
                        const reading = site.readings[type];
                        if (!reading) return null;
                        return (
                          <Gauge
                            key={type}
                            label={SENSOR_TYPE_LABELS_AR[type]}
                            value={reading.value}
                            unit={reading.unit}
                            max={SENSOR_MAX[type]}
                            status={reading.status}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </section>

              <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
                <h2 className="mb-4 text-sm font-semibold text-text-primary">ملخص كل المباني</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle text-start text-xs text-text-tertiary">
                        <th className="pb-2 text-start font-medium">المبنى</th>
                        <th className="pb-2 text-start font-medium">الحالة</th>
                        <th className="pb-2 text-start font-medium">التنبيهات النشطة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sites.map((site) => (
                        <tr key={site.id} className="border-b border-border-subtle last:border-0">
                          <td className="py-2.5 text-text-primary">{site.name}</td>
                          <td className="py-2.5">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[site.status]}`}>
                              {IOT_STATUS_LABELS_AR[site.status]}
                            </span>
                          </td>
                          <td className="py-2.5 text-text-secondary" dir="ltr">
                            {site.activeAlertsCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
