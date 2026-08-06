"use client";

import dynamic from "next/dynamic";

export const LeafletMapDynamic = dynamic(
  () => import("@/components/leaflet-map").then((m) => m.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[360px] animate-pulse rounded-[var(--radius-lg)] border border-border-subtle bg-sunken" />
    ),
  },
);
