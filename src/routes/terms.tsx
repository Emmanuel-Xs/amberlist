import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '#/components/LegalPage'

export const Route = createFileRoute('/terms')({
  component: Terms,
  head: () => ({
    meta: [
      { title: 'Terms of Service · Honeylist' },
      {
        name: 'description',
        content: 'The simple rules for using Honeylist.',
      },
    ],
    links: [{ rel: 'canonical', href: 'https://honeylist.vercel.app/terms' }],
  }),
})

function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="By using Honeylist you agree to these terms. They are short and written in plain language."
    >
      <h2>The service</h2>
      <p>
        Honeylist is a free to do, notes and habits app built as an HNG
        Internship project. You can use it as a guest or sign in with Google to
        keep your data across devices.
      </p>

      <h2>Your content</h2>
      <p>
        What you write is yours. You give us permission only to store and
        display it so the app works for you. You are responsible for what you
        put in it.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Do not use Honeylist for anything unlawful or harmful.</li>
        <li>
          Do not try to break, overload or gain access to other people's data.
        </li>
        <li>
          AI features are limited to 20 requests a day per account. Please do
          not automate around the limit.
        </li>
      </ul>

      <h2>Accounts</h2>
      <p>
        Guest data lives with your browser and your guest session, so clearing
        site data can lose it. Signing in with Google keeps it safe across
        devices. You can export or delete everything from your Profile at any
        time.
      </p>

      <h2>No warranty</h2>
      <p>
        Honeylist is provided as is. We work to keep it reliable, but we do not
        promise it will always be available or error free, and AI suggestions
        can be wrong. To the fullest extent the law allows, we are not liable
        for lost data or indirect damages, so keep a copy of anything important
        (the JSON export helps).
      </p>

      <h2>Changes and ending</h2>
      <p>
        We may update these terms or the service, and we will change the date
        above when we do. You can stop using Honeylist at any time, and we may
        suspend accounts that break these terms.
      </p>

      <h2>Privacy</h2>
      <p>
        How we handle your data is explained in our{' '}
        <a href="/privacy">Privacy Policy</a>.
      </p>
    </LegalPage>
  )
}
