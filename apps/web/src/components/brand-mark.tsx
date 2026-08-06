export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="18.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.4" />
      <circle cx="20" cy="20" r="12.5" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.4" />
      <path
        d="M20 20L20 3.5A16.5 16.5 0 0 1 33.5 27.5L20 20Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <circle cx="20" cy="20" r="3.4" fill="currentColor" />
    </svg>
  );
}
