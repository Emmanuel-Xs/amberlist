# Reminders and notifications

## Purpose
Remind people when a task starts, even when the tab is closed. Designed on the Round 4 canvas, boards 19 to 21.

## Status
Built 2026-09-30 (code, tests, browser checks of the pickers, pre prompt, banners and menu). **Not yet verified end to end on the live site**: it needs the env vars and the GitHub Actions secret below, then a real push on a phone and a desktop.

## How it works
- **Data:** `task.remind_offset` (minutes before the start, null off), `task.remind_at` (exact moment, indexed, null once sent), `prefs.timezone`, table `push_subscription`. The old `remind` boolean is kept in step (true when an offset is set); the API still accepts `remind: true` as "when it starts".
- **Rule for the time (D29):** reminders count from the start date and start time, in the person's time zone (sent by the app on load). With no start time we use 09:00 and say so under the picker. With no start date but a due date we use the due date. A reminder in the past is not armed. `src/lib/reminders.ts` (tested).
- **Picker:** `src/components/RemindPicker.tsx`: No reminder, When it starts, 10 minutes, 1 hour, 1 day before, Custom time (day plus time, saved as minutes). Popover from 768 px, sheet on phones. Blocked shows a warning with How to fix.
- **Permission flow:** `NotifyDialogs.tsx`. First time a reminder is chosen and the browser hasn't been asked: our pre prompt ("Want a nudge when it is time?"), then the browser's box, then a toast. "Not now" rests for 7 days (`prefs.nudge_state.notify`). Denied shows the How to fix sheet (with the iPhone Home Screen note). Permission is read live from `Notification.permission`.
- **Delivery:** Web Push. `public/sw.js` handles `push` (Done and Snooze buttons on Chrome, Edge and Android; a focused tab gets a message and shows its own banner instead) and `notificationclick`. `src/server/push.ts` (`web-push`) sends; `POST /api/cron/reminders` (bearer `CRON_SECRET`, not a session route) claims due rows with one `UPDATE ... RETURNING` that nulls `remind_at`, so nothing is sent twice, then sends to the person's browsers. Subscriptions the push service reports gone (404 or 410) are deleted. Only people with a subscribed browser are claimed; the rest keep `remind_at` for the in app banner.
- **Scheduler (D30):** `.github/workflows/reminders.yml` calls the endpoint. GitHub runs schedules about every 5 minutes at best, so a reminder can arrive a few minutes late.
- **Snooze:** `POST /api/tasks/:id/snooze { minutes }` (10 minutes, 1 hour, Tomorrow 09:00 from the banner and the task menu; the notification's Snooze is 10 minutes).
- **In app:** `ReminderUi.tsx`: banners at the top of Home and Tasks (a reminder that fired, with Snooze and Done; and "Reminders are off on this device" once a day), reminder chip on rows and cards (bell plus time, amber soft when snoozed, slashed bell when blocked), Profile row with Off, On for this browser (Send a test, Turn off) and Blocked (`NotifySettings.tsx`).
- **Endpoints:** `GET /api/push/config`, `POST` and `DELETE /api/push/subscription`, `POST /api/push/test`, `POST /api/tasks/:id/snooze`, `POST /api/cron/reminders`.

## Setup (owner)
1. `npx web-push generate-vapid-keys`, then set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (mailto:) and `CRON_SECRET` on Vercel.
2. GitHub repo, Settings, Secrets and variables, Actions: secret `CRON_SECRET` (same value) and variable `APP_URL` (`https://honeylist.vercel.app`).
3. Redeploy. On the live site: Profile, Turn on, Send a test.

## Known issues
- The service worker only runs in production builds, so push cannot be tried on `npm run dev`; use `npm run build` and `npx vite preview`, or the live site.
- Safari and iPhone show no Done and Snooze buttons on the notification (tap opens the task). The "Done and Snooze at the top of the task" treatment for a tap is not built.
- Habit reminder times (`habit.reminder_time`) are still stored only.
- Delivery is only as punctual as the GitHub schedule.

## How to test
1. `npm test` covers the time maths, the endpoints and the sender (with a stub push service).
2. Browser: create a task starting in 15 minutes with "10 minutes before"; the chip shows the time; with permission not granted the banner appears when it is due.
3. Live: turn on in Profile, Send a test, close the tab, wait for a real reminder, tap Done and Snooze.
4. Playwright: stub `window.Notification` in `addInitScript` and assert the pre prompt, denied help and banner.
