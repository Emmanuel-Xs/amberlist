# Profile and settings

## Purpose
Name, theme, sounds, shortcuts, and control over your data. The PRD's `/settings` shipped as `/profile` (D13).

## Status
Built. Google save action and privacy note not built.

## How it works now
- Route `/profile` (`src/routes/profile.tsx`). Reached from the sidebar (1024+), the rail icon (tablet) and the phone Home header link "Profile".
- Profile card: avatar initial, form with Input "What should we call you?" (max 40) and "Save" (disabled until changed), toast "Name saved"; a "Guest" pill with "Everything is saved to this browser's account."
- Stats: tasks done this month, open tasks, notes.
- "Save your data" card: static text saying Google sign in is coming next.
- Settings: Theme radiogroup "Theme" (Dark, Light, Match device); Switch "Sounds" (plays a sample when turned on); "Keyboard shortcuts (?)" button from tablet up.
- Your data: "Export as JSON" (downloads `honeylist-export-YYYY-MM-DD.json` from `GET /api/me/data`), "Delete all my data" opens `ConfirmDialog` "Delete all your data?" with "Type **DELETE** to confirm" (bold red word) and "Delete everything" (disabled until typed). Toast "All your data was deleted".
- Footer: logo and "Honeylist 0.1 · Built with AI for HNG 15".
- API: `GET/PATCH /api/me` (`displayName`, `theme`, `sounds`), `GET/DELETE /api/me/data`. Theme is applied in `useTheme` (`src/components/AppShell.tsx`) and cached in `localStorage['honeylist-theme']`; the pre paint script in `src/routes/__root.tsx` reads it.

## Planned per PRD
- Guest badge plus "Save your data with Google" action, then signed in state (see [guest-auth-and-google](guest-auth-and-google.md)).
- Short privacy note: what is stored.
- Onboarding sets name and theme first (see [onboarding](onboarding.md)).

## Known issues
- Delete all also clears prefs (name, theme, sounds) and the default folders re seed on the next load. The dialog copy only mentions tasks, notes and folders.

## How to test
1. `open(page, '/profile')`. Fill `getByLabel('What should we call you?')` "Emmanuel", click `Save`: toast "Name saved"; Home greeting ends ", Emmanuel".
2. Click `getByRole('radio', { name: 'Light' })`: `html[data-theme="light"]`; reload keeps it. `Match device` with `page.emulateMedia({ colorScheme: 'light' })` gives light.
3. Toggle `getByRole('switch', { name: 'Sounds' })`: `aria-checked` flips; `GET /api/me` sounds matches.
4. Export: `const d = page.waitForEvent('download')`, click "Export as JSON", filename starts `honeylist-export-`.
5. Click "Delete all my data": `getByRole('alertdialog', { name: 'Delete all your data?' })`; "Delete everything" is disabled; `.confirm-word` is bold and uses `--danger`; fill `getByLabel(/Type DELETE/)` with `DELETE`; button enables; confirm; toast; `GET /api/tasks` is empty.
6. Tablet and desktop: "Keyboard shortcuts (?)" opens dialog "Keyboard shortcuts". Phone: button hidden.
