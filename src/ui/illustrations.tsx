import type { ReactNode } from 'react'
import { LogoMark } from '#/ui/logo'

export type IllustrationName =
  'tasks' | 'done' | 'notes' | 'folder' | 'search' | 'offline'

type Fill = 'lavender' | 'butter' | 'mint' | 'peach' | 'sky' | 'surface-raised'

/** Pointy-top hexagon points, matching the cells inside the logo. */
function hex(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, k) => {
    const a = ((-90 + 60 * k) * Math.PI) / 180
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')
}

function Cell({
  cx,
  cy,
  r,
  fill,
  delay = 0,
  children,
}: {
  cx: number
  cy: number
  r: number
  fill: Fill
  delay?: number
  children?: ReactNode
}) {
  return (
    <g className="zn-illo-float" style={{ animationDelay: `${delay}s` }}>
      <polygon
        points={hex(cx, cy, r)}
        style={{ fill: `var(--${fill})` }}
        stroke="var(--on-pastel)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {children}
    </g>
  )
}

const ink = {
  stroke: 'var(--on-pastel)',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
}

const Ground = () => (
  <ellipse
    cx={100}
    cy={140}
    rx={62}
    ry={7}
    style={{ fill: 'var(--surface-raised)' }}
  />
)

const Logo = ({ dim }: { dim?: boolean }) => (
  <g style={{ opacity: dim ? 0.45 : 1 }}>
    <LogoMark size={88} x={56} y={30} />
  </g>
)

const Sparkle = ({ x, y }: { x: number; y: number }) => (
  <path
    d={`M${x} ${y - 6}v12M${x - 6} ${y}h12`}
    stroke="var(--accent)"
    strokeWidth={3}
    strokeLinecap="round"
    className="zn-illo-float"
  />
)

const ART: Record<IllustrationName, () => ReactNode> = {
  tasks: () => (
    <>
      <Ground />
      <Cell cx={34} cy={54} r={18} fill="lavender" />
      <Cell cx={168} cy={48} r={15} fill="mint" delay={0.6} />
      <Cell cx={154} cy={110} r={12} fill="peach" delay={1.2} />
      <Cell cx={44} cy={112} r={10} fill="sky" delay={1.8} />
      <Logo />
    </>
  ),
  done: () => (
    <>
      <Ground />
      <Cell cx={34} cy={52} r={18} fill="mint" />
      <Cell cx={166} cy={46} r={15} fill="butter" delay={0.6} />
      <Cell cx={156} cy={108} r={12} fill="lavender" delay={1.2} />
      <Cell cx={44} cy={110} r={10} fill="peach" delay={1.8} />
      <Sparkle x={24} y={20} />
      <Sparkle x={182} y={88} />
      <Sparkle x={112} y={16} />
      <Logo />
    </>
  ),
  notes: () => (
    <>
      <Ground />
      <Cell cx={36} cy={58} r={22} fill="butter">
        <path {...ink} d="M27 52h18M27 59h18M27 66h10" />
      </Cell>
      <Cell cx={168} cy={52} r={14} fill="lavender" delay={0.8} />
      <Cell cx={154} cy={112} r={11} fill="mint" delay={1.4} />
      <Logo />
    </>
  ),
  folder: () => (
    <>
      <Ground />
      <Cell cx={30} cy={60} r={13} fill="peach" />
      <Cell cx={49} cy={60} r={13} fill="butter" delay={0.4} />
      <Cell cx={39.5} cy={78} r={13} fill="mint" delay={0.8} />
      <Cell cx={168} cy={50} r={15} fill="sky" delay={1.2} />
      <Cell cx={154} cy={112} r={11} fill="lavender" delay={1.6} />
      <Logo />
    </>
  ),
  search: () => (
    <>
      <Ground />
      <Cell cx={34} cy={54} r={16} fill="sky" />
      <Cell cx={168} cy={44} r={13} fill="lavender" delay={0.8} />
      <Logo />
      <g className="zn-illo-float" style={{ animationDelay: '0.4s' }}>
        <circle
          cx={132}
          cy={88}
          r={22}
          {...ink}
          strokeWidth={5}
          style={{ fill: 'var(--sky)', fillOpacity: 0.35 }}
        />
        <path {...ink} strokeWidth={6} d="M148 104l16 16" />
      </g>
    </>
  ),
  offline: () => (
    <>
      <Ground />
      <Cell cx={34} cy={54} r={16} fill="surface-raised" />
      <Cell cx={168} cy={50} r={13} fill="surface-raised" />
      <Logo dim />
      <path
        d="M52 32l96 96"
        stroke="var(--danger)"
        strokeWidth={6}
        strokeLinecap="round"
      />
    </>
  ),
}

export function Illustration({
  name,
  width = 180,
}: {
  name: IllustrationName
  width?: number
}) {
  return (
    <svg
      width={width}
      height={width * 0.75}
      viewBox="0 0 200 150"
      className="zn-illo"
      aria-hidden="true"
    >
      {ART[name]()}
    </svg>
  )
}
