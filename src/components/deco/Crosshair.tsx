/** Crosshair statis. Dekorasi → aria-hidden. */
export function Crosshair({
  size = 40,
  className = "text-acid",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      className={className}
    >
      <circle cx="20" cy="20" r="9" />
      <path d="M20 0v14M20 26v14M0 20h14M26 20h14" />
      <rect x="19" y="19" width="2" height="2" fill="currentColor" stroke="none" />
    </svg>
  );
}
