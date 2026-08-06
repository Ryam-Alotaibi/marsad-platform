"use client";

import { useEffect, useState } from "react";
import { fetchTelecomMap, type TelecomSite } from "@/lib/api";
import { MapPageShell } from "@/components/map-page-shell";
import { LeafletMapDynamic } from "@/components/leaflet-map-dynamic";

const TOPOLOGY_COLOR: Record<string, string> = { GREEN: "#1f9d6b", ORANGE: "#d68a1f", RED: "#dd3f4f" };

function packetLossTone(pct: number | null): string {
  if (pct === null) return "text-text-tertiary";
  if (pct > 3) return "text-danger";
  if (pct > 1) return "text-warning";
  return "text-success";
}

export default function TelecomMapPage() {
  const [sites, setSites] = useState<TelecomSite[] | null>(null);

  useEffect(() => {
    fetchTelecomMap().then(setSites);
  }, []);

  const providerNames = sites?.[0]?.providers.map((p) => p.providerName) ?? [];

  return (
    <MapPageShell>
      {sites && (
        <LeafletMapDynamic
          markers={sites.map((s) => ({
            id: s.id,
            lat: s.latitude ?? 0,
            lng: s.longitude ?? 0,
            color: TOPOLOGY_COLOR[s.topologyStatus],
            title: s.name,
            subtitle: `حالة الطوبولوجيا: ${s.topologyStatus === "GREEN" ? "متصل" : s.topologyStatus === "ORANGE" ? "تحذير" : "معطل"}`,
          }))}
        />
      )}

      <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">مصفوفة مركز العمليات الشبكية (NOC)</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-start text-xs text-text-tertiary">
                <th className="pb-2 text-start font-medium">المنطقة/الموقع</th>
                {providerNames.map((name) => (
                  <th key={name} className="pb-2 text-start font-medium">{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sites?.map((site) => (
                <tr key={site.id} className="border-b border-border-subtle last:border-0">
                  <td className="py-2.5 font-medium text-text-primary">{site.name}</td>
                  {site.providers.map((p) => (
                    <td key={p.providerId} className="py-2.5">
                      <span className={packetLossTone(p.packetLossPct)}>
                        {p.latencyMs !== null ? `${Math.round(p.latencyMs)} ms` : "—"}
                      </span>
                      <span className="ms-1.5 text-xs text-text-tertiary" dir="ltr">
                        ({p.packetLossPct !== null ? `${p.packetLossPct.toFixed(1)}%` : "—"})
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </MapPageShell>
  );
}
