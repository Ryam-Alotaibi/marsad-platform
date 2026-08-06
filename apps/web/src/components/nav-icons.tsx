type IconProps = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

export function BoltIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M13 3 5 13.5h5.5L11 21l8-10.5h-5.5L13 3Z" />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3.5 5 6v6c0 4.2 2.8 7.4 7 8.5 4.2-1.1 7-4.3 7-8.5V6l-7-2.5Z" />
      <path d="M9.3 12.2 11.3 14l3.4-4" />
    </svg>
  );
}

export function MapIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M9 4.5 4 6.3v13.2l5-1.8 6 1.8 5-1.8V4.5l-5 1.8-6-1.8Z" />
      <path d="M9 4.5v13.2M15 6.3v13.2" />
    </svg>
  );
}

export function SensorIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M9.5 9.5h5v5h-5zM12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5 7.7 7.7M16.3 16.3l2.2 2.2M18.5 5.5 16.3 7.7M7.7 16.3l-2.2 2.2" />
    </svg>
  );
}

export function EnergyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3c-4 3-6 6.2-6 9.5A6 6 0 0 0 18 12.5C18 9.2 16 6 12 3Z" />
      <path d="M12 9v5.5" />
    </svg>
  );
}

export function ChatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 5.5h16v10.5H9.5L5 19.5v-3.5H4V5.5Z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </svg>
  );
}

export function GaugeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 15.5a8 8 0 1 1 16 0" />
      <path d="M12 15.5 16 10" />
      <path d="M12 15.5h.01" />
    </svg>
  );
}

export function HeadsetIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 13.5v-1a8 8 0 0 1 16 0v1" />
      <rect x="3.2" y="13" width="3.6" height="5.5" rx="1.3" />
      <rect x="17.2" y="13" width="3.6" height="5.5" rx="1.3" />
      <path d="M18.5 18.5v.5a2.5 2.5 0 0 1-2.5 2.5h-3" />
    </svg>
  );
}

export function SlidersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h13M21 18h-1" />
      <circle cx="13" cy="6" r="2" />
      <circle cx="7" cy="12" r="2" />
      <circle cx="16" cy="18" r="2" />
    </svg>
  );
}

export function BookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 5.5c2-1 5-1 7 0v13c-2-1-5-1-7 0v-13Z" />
      <path d="M20 5.5c-2-1-5-1-7 0v13c2-1 5-1 7 0v-13Z" />
    </svg>
  );
}

export function NetworkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="5" r="2.3" />
      <circle cx="5" cy="18" r="2.3" />
      <circle cx="19" cy="18" r="2.3" />
      <path d="M10.5 6.8 6.5 16M13.5 6.8l4 9.2M7.3 18h9.4" />
    </svg>
  );
}

export function RadarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="9" strokeDasharray="2.5 3" />
      <circle cx="12" cy="12" r="5" strokeDasharray="2.5 3" />
      <path d="M12 12 17 7" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ClipboardListIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="5.5" y="4.5" width="13" height="16" rx="1.5" />
      <path d="M9 4.5V3.8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v.7" />
      <path d="M8.5 10.5h7M8.5 13.5h7M8.5 16.5h4.5" />
    </svg>
  );
}

export function InfoIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ShieldCheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3.5 5 6v6c0 4.2 2.8 7.4 7 8.5 4.2-1.1 7-4.3 7-8.5V6l-7-2.5Z" />
      <path d="M9 12.3 11 14l4-4.3" />
      <path d="M12 3.5v17" strokeDasharray="1.5 2" opacity="0.5" />
    </svg>
  );
}
