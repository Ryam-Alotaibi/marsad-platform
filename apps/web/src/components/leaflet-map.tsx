"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  color: string;
  title: string;
  subtitle?: string;
}

function markerIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  useEffect(() => {
    const valid = markers.filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng));
    if (valid.length === 0) return;
    const bounds = L.latLngBounds(valid.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
  }, [markers, map]);
  return null;
}

export function LeafletMap({ markers, height = "360px" }: { markers: MapMarker[]; height?: string }) {
  const valid = markers.filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng));
  const center: [number, number] = valid.length
    ? [valid[0].lat, valid[0].lng]
    : [24.7136, 46.6753];

  return (
    <div style={{ height }} className="overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle">
      <MapContainer center={center} zoom={9} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds markers={valid} />
        {valid.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={markerIcon(m.color)}>
            <Popup>
              <div style={{ fontFamily: "inherit" }}>
                <strong>{m.title}</strong>
                {m.subtitle && <div>{m.subtitle}</div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
