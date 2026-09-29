/** Honeylist mark: a rounded honeycomb cell with a check. Colors come from tokens so it works in both themes. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <path
        d="M32 8 52.8 20v24L32 56 11.2 44V20Z"
        fill="var(--accent)"
        stroke="var(--accent)"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <path
        d="m22 33 7 7 13-14"
        fill="none"
        stroke="var(--on-accent)"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Mark plus wordmark. Pass showName={false} for the mark alone. */
export function Logo({
  size = 32,
  showName = true,
}: {
  size?: number
  showName?: boolean
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        fontWeight: 700,
        fontSize: size * 0.62,
        letterSpacing: '-0.01em',
        color: 'var(--ink)',
      }}
    >
      <LogoMark size={size} />
      {showName && <span>Honeylist</span>}
    </span>
  )
}
