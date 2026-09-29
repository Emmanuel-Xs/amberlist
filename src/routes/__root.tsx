import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { AppShell } from '#/components/AppShell'
import { LogoMark } from '#/ui/logo'
import appCss from '../styles.css?url'

const TITLE = 'Honeylist: tasks, notes and a scratchpad in one calm place'
const DESCRIPTION =
  'A calm to-do app for students and young professionals. Plan your day, keep notes beside your tasks, and capture thoughts in a scratchpad. Works on phone, tablet and desktop.'

// Applies the saved theme before first paint so there is no flash.
const THEME_SCRIPT = `try{var t=localStorage.getItem('honeylist-theme')||'dark';if(t==='system'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.dataset.theme=t}catch(e){}`

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        { charSet: 'utf-8' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, viewport-fit=cover',
        },
        { title: TITLE },
        { name: 'description', content: DESCRIPTION },
        {
          name: 'theme-color',
          content: '#1c1d21',
          media: '(prefers-color-scheme: dark)',
        },
        {
          name: 'theme-color',
          content: '#f4f3ef',
          media: '(prefers-color-scheme: light)',
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: TITLE },
        { property: 'og:description', content: DESCRIPTION },
        { property: 'og:image', content: 'https://honeylist.vercel.app/og.png' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: TITLE },
        { name: 'twitter:description', content: DESCRIPTION },
        { name: 'twitter:image', content: 'https://honeylist.vercel.app/og.png' },
      ],
      links: [
        { rel: 'stylesheet', href: appCss },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossOrigin: 'anonymous',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
        },
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
      ],
      scripts: [
        { children: THEME_SCRIPT },
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Honeylist',
            applicationCategory: 'ProductivityApplication',
            operatingSystem: 'Any',
            description: DESCRIPTION,
            offers: { '@type': 'Offer', price: '0' },
          }),
        },
      ],
    }),
    shellComponent: RootDocument,
    component: RootComponent,
    notFoundComponent: NotFound,
  },
)

function NotFound() {
  return (
    <div
      style={{
        padding: '48px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        textAlign: 'center',
      }}
    >
      <LogoMark size={96} />
      <h1 className="title" style={{ margin: 0 }}>
        That page has let go
      </h1>
      <p style={{ margin: 0, color: 'var(--ink-muted)' }}>
        We couldn't find what you were looking for.
      </p>
      <Link
        to="/"
        className="zn-btn zn-btn--primary zn-btn--md"
        style={{ textDecoration: 'none' }}
      >
        <span className="zn-btn-label">Back home</span>
      </Link>
    </div>
  )
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext()
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <Outlet />
      </AppShell>
    </QueryClientProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
        <noscript>
          <style>{'.splash{display:none}'}</style>
        </noscript>
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
