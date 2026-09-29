import { useId } from 'react'
import { CELLS, DROP_PATH, HEX_PATH, STUB_PATH } from '#/ui/logo-data'

/**
 * Honeylist mark: a honeycomb cell whose check is built from cells, with a drop of honey
 * that has just let go. Colors come from tokens, so it works in both themes.
 * `animated` makes the drop form and fall on a loop (used on the loading screen).
 */
export function LogoMark({
  size = 32,
  animated,
  className,
  x,
  y,
}: {
  size?: number
  animated?: boolean
  className?: string
  /** Position when nested inside another svg (used by the empty state art). */
  x?: number
  y?: number
}) {
  const clipId = `hl-${useId().replace(/:/g, '')}`
  const detail = size >= 28
  return (
    <svg
      width={size}
      height={size}
      x={x}
      y={y}
      viewBox="-6 -1 76 76"
      aria-hidden="true"
      focusable="false"
      className={['logo-mark', animated && 'logo-mark--animated', className]
        .filter(Boolean)
        .join(' ')}
      style={{ flexShrink: 0, display: 'block' }}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={HEX_PATH} />
        </clipPath>
      </defs>
      <path
        d={HEX_PATH}
        fill="var(--accent)"
        stroke="var(--accent)"
        strokeWidth="10"
        strokeLinejoin="round"
      />
      <path d={STUB_PATH} fill="var(--accent)" />
      <path d={DROP_PATH} fill="var(--accent)" className="logo-drop" />
      <g clipPath={`url(#${clipId})`}>
        {CELLS.map((c) =>
          c.on ? (
            <polygon
              key={c.p}
              points={c.p}
              fill="var(--on-accent)"
              stroke="var(--on-accent)"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          ) : (
            detail && (
              <polygon
                key={c.p}
                points={c.p}
                fill="none"
                stroke="var(--on-accent)"
                strokeWidth="1.2"
                opacity=".22"
              />
            )
          ),
        )}
      </g>
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
