"use client";

import { useEffect, useState } from "react";
import { fetchWeatherMap, type WeatherSite } from "@/lib/api";
import { MapPageShell } from "@/components/map-page-shell";
import { LeafletMapDynamic } from "@/components/leaflet-map-dynamic";

const BAND_COLOR: Record<string, string> = {
  GREEN: "#1f9d6b",
  YELLOW: "#e3b341",
  ORANGE: "#d68a1f",
  RED: "#dd3f4f",
  CRITICAL: "#8f1d29",
};

const BAND_LABEL: Record<string, string> = {
  GREEN: "طبيعي (<25°)",
  YELLOW: "مراقبة (25-35°)",
  ORANGE: "تحذير (35-40°)",
  RED: "خطر (40-45°)",
  CRITICAL: "حرج (>45°)",
};

export default function WeatherMapPage() {
  const [sites, setSites] = useState<WeatherSite[] | null>(null);

  useEffect(() => {
    fetchWeatherMap().then(setSites);
  }, []);

  return (
    <MapPageShell>
      {sites && (
        <LeafletMapDynamic
          markers={sites.map((s) => ({
            id: s.id,
            lat: s.latitude ?? 0,
            lng: s.longitude ?? 0,
            color: BAND_COLOR[s.band],
            title: s.name,
            subtitle: `${s.temperatureC?.toFixed(1)}° — ${BAND_LABEL[s.band]}`,
          }))}
        />
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sites?.map((s) => (
          <div key={s.id} className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">{s.name}</h3>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                style={{ background: BAND_COLOR[s.band] }}
              >
                {BAND_LABEL[s.band]}
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold text-text-primary">{s.temperatureC?.toFixed(1)}°</p>
            <p className="mt-1 text-xs text-text-tertiary">
              رطوبة {s.humidityPct?.toFixed(0)}% · جودة الهواء {s.aqi?.toFixed(0)}
            </p>
          </div>
        ))}
      </section>
    </MapPageShell>
  );
}
