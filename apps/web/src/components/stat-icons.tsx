type IconProps = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function ActivityIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3 12h4l2.5-7L13 19l2.5-7H21" />
    </svg>
  );
}

export function PulseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 20.5s-7.5-4.6-9.5-9.3C1.2 7.8 3 4.5 6.3 4.5c2 0 3.4 1.2 4.2 2.6C11.3 5.7 12.7 4.5 14.7 4.5c3.3 0 5.1 3.3 3.8 6.7-2 4.7-9.5 9.3-9.5 9.3Z" />
      <path d="M6 12h2.5l1.3-2.6L11.5 15l1.4-3h3.2" />
    </svg>
  );
}

export function CloudIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M7 18a4.2 4.2 0 0 1-.5-8.4A5.5 5.5 0 0 1 17 8.4a4 4 0 0 1-.6 9.6H7Z" />
    </svg>
  );
}

export function ThermometerIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0Z" />
      <circle cx="10" cy="17" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function SignalIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 18h1.6v-3H4v3ZM8.2 18h1.6v-6H8.2v6ZM12.4 18H14V9h-1.6v9ZM16.6 18h1.6V5h-1.6v13Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
