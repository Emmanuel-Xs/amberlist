import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '#/components/LegalPage'

export const Route = createFileRoute('/privacy')({
  component: Privacy,
  head: () => ({
    meta: [
      { title: 'Privacy Policy · Honeylist' },
      {
        name: 'description',
        content:
          'What Honeylist stores, why, who processes it, and how to export or delete your data.',
      },
    ],
    links: [{ rel: 'canonical', href: 'https://honeylist.vercel.app/privacy' }],
  }),
})

function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="Honeylist is a calm to do app with notes, habits and a scratchpad. This page explains what we keep, why, and how you stay in control. We keep it short on purpose."
    >
      <h2>What we store</h2>
      <ul>
        <li>
          <strong>Your content:</strong> tasks, subtasks, notes, scratchpad
          text, folders and habits, plus the name you choose and your
          preferences (theme, sounds).
        </li>
        <li>
          <strong>A guest account:</strong> the first time you open the app we
          create an anonymous account and set a session cookie so your data
          stays with your browser. No sign up is needed.
        </li>
        <li>
          <strong>If you sign in with Google:</strong> your name, email address
          and profile photo, and your Google account ID. We use them only to
          recognise you and show your name and photo in the app.
        </li>
        <li>
          <strong>In your browser:</strong> a few small settings in local
          storage (for example list or grid view and whether a tip was shown)
          and a service worker that lets the app open offline.
        </li>
      </ul>

      <h2>What we do not do</h2>
      <ul>
        <li>We do not sell your data or use it for advertising.</li>
        <li>We do not use analytics or tracking cookies.</li>
        <li>We do not read your tasks or notes except to run the app.</li>
      </ul>

      <h2>AI features</h2>
      <p>
        If you press Break it down or Turn into tasks, the text you selected (a
        task title or a note) is sent to an AI provider to produce the result.
        We try Groq first and Google Gemini as a backup, and xAI if it is
        configured. We send only that text, never your account details. Nothing
        is sent unless you press the button, and each account is limited to 20
        AI requests a day.
      </p>

      <h2>Who processes your data</h2>
      <ul>
        <li>Vercel hosts the app.</li>
        <li>Neon stores the database.</li>
        <li>
          Google handles sign in, and Groq and Google process AI requests.
        </li>
      </ul>
      <p>These providers act on our behalf and only to run the service.</p>

      <h2>Google user data</h2>
      <p>
        Honeylist asks Google only for your basic profile (name, email and
        photo). We use that information to sign you in and show your account in
        the app, and for nothing else. We do not share it, sell it, or use it
        for advertising. Honeylist's use of information received from Google
        APIs follows the{' '}
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noreferrer"
        >
          Google API Services User Data Policy
        </a>
        , including its Limited Use requirements.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>
          <strong>Export:</strong> Profile, then Export as JSON, gives you
          everything we hold.
        </li>
        <li>
          <strong>Delete:</strong> Profile, then Delete all my data, removes
          your tasks, notes, folders and habits right away. Guests get a fresh
          empty account.
        </li>
        <li>
          <strong>Google access:</strong> you can remove Honeylist any time at
          myaccount.google.com/permissions.
        </li>
        <li>Guest accounts unused for 90 days may be deleted automatically.</li>
      </ul>

      <h2>Security</h2>
      <p>
        Traffic uses HTTPS. Your data is private to your account and never shown
        to other users. No system is perfectly secure, so please do not store
        passwords or other secrets in your notes.
      </p>

      <h2>Children</h2>
      <p>
        Honeylist is not aimed at children under 13 and we do not knowingly
        collect their data.
      </p>

      <h2>Changes</h2>
      <p>
        If we change this policy we will update the date above. Continuing to
        use Honeylist means you accept the updated policy.
      </p>
    </LegalPage>
  )
}
