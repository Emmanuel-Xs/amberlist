import { MotionConfig } from 'motion/react'
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
import { PwaSupport } from '#/components/PwaSupport'
import { LogoMark } from '#/ui/logo'
import appCss from '../styles.css?url'
import poppins400 from '@fontsource/poppins/files/poppins-latin-400-normal.woff2?url'
import poppins500 from '@fontsource/poppins/files/poppins-latin-500-normal.woff2?url'
import poppins600 from '@fontsource/poppins/files/poppins-latin-600-normal.woff2?url'
import poppins700 from '@fontsource/poppins/files/poppins-latin-700-normal.woff2?url'

const SITE = 'https://honeylist.vercel.app'
const TITLE = 'Honeylist: a calm to do list with notes, habits and AI'
const DESCRIPTION =
  'A calm, free to do app. Plan tasks with subtasks and dates, keep notes beside them, dump thoughts in a scratchpad, build habits and sort it all into folders. AI breaks big tasks into steps. Installs as an app and works offline.'
const KEYWORDS =
  'to do list, todo app, task manager, notes app, scratchpad, habit tracker, folders, subtasks, AI task breakdown, productivity, PWA, offline, Honeylist'
const FEATURES = [
  'Tasks with start and due dates, priority and subtasks',
  'Markdown notes with checklists, linked to tasks',
  'Always there scratchpad that turns lines into tasks',
  'Folders for tasks and habits',
  'Habit tracking with streaks',
  'Guest mode, then Google sign in to sync across devices',
  'AI task breakdown and turn notes into tasks',
  'Installable PWA that works offline',
]

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
        { name: 'keywords', content: KEYWORDS },
        { name: 'application-name', content: 'Honeylist' },
        { name: 'apple-mobile-web-app-title', content: 'Honeylist' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        {
          name: 'apple-mobile-web-app-status-bar-style',
          content: 'black-translucent',
        },
        { name: 'format-detection', content: 'telephone=no' },
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
        { property: 'og:site_name', content: 'Honeylist' },
        { property: 'og:locale', content: 'en_GB' },
        { property: 'og:url', content: `${SITE}/` },
        { property: 'og:title', content: TITLE },
        { property: 'og:description', content: DESCRIPTION },
        { property: 'og:image', content: `${SITE}/og.png` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        {
          property: 'og:image:alt',
          content: 'The Honeylist logo, a honeycomb cell with a honey drop',
        },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: TITLE },
        { name: 'twitter:description', content: DESCRIPTION },
        { name: 'twitter:image', content: `${SITE}/og.png` },
      ],
      links: [
        ...[poppins400, poppins500, poppins600, poppins700].map((href) => ({
          rel: 'preload',
          as: 'font',
          type: 'font/woff2',
          href,
          crossOrigin: 'anonymous' as const,
        })),
        { rel: 'stylesheet', href: appCss },
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'canonical', href: `${SITE}/` },
      ],
      scripts: [
        { children: THEME_SCRIPT },
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': ['SoftwareApplication', 'WebApplication'],
            name: 'Honeylist',
            url: `${SITE}/`,
            image: `${SITE}/og.png`,
            applicationCategory: 'ProductivityApplication',
            operatingSystem: 'Any (web, installable PWA)',
            browserRequirements:
              'Requires JavaScript. Works offline once installed.',
            description: DESCRIPTION,
            featureList: FEATURES,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
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
      <MotionConfig reducedMotion="user">
        <AppShell>
          <Outlet />
        </AppShell>
        <PwaSupport />
      </MotionConfig>
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
