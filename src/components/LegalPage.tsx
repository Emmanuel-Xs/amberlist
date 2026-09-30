import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { LogoMark } from '#/ui/logo'

export const LEGAL_UPDATED = '30 September 2026'
export const CONTACT_EMAIL = 'emmanuelxs101@gmail.com'

/** Shared frame for the public privacy policy and terms pages. */
export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string
  intro: string
  children: ReactNode
}) {
  return (
    <article className="legal">
      <Link to="/" className="legal-brand" aria-label="Honeylist home">
        <LogoMark size={40} />
        <span>Honeylist</span>
      </Link>
      <h1 className="title" style={{ margin: '20px 0 4px' }}>
        {title}
      </h1>
      <p className="legal-meta">Last updated {LEGAL_UPDATED}</p>
      <p>{intro}</p>
      {children}
      <p className="legal-meta" style={{ marginTop: 32 }}>
        Questions? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        . See also our <Link to="/privacy">Privacy Policy</Link> and{' '}
        <Link to="/terms">Terms of Service</Link>.
      </p>
    </article>
  )
}
