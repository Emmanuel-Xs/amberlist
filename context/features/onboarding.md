# Onboarding

## Purpose
A single, skippable welcome that asks "What should we call you?" and lets people pick dark or light, then gets out of the way. Plus just in time tips.

## Status
Not built. Needs design approval (not in the canvas).

## How it works now
- No welcome screen. The name can only be set in Profile ("What should we call you?"), so Home greets "Good evening" with no name, which Emmanuel finds weird (L1).
- First visit Home shows the "Add your first task" empty state as the only guidance.
- Prefs table has `displayName`, `theme`, `sounds`, `seeded`; no `seenTips` or onboarding flag.

## Planned per PRD
- One welcome screen on first visit: name input plus a dark or light preview. Skippable. Straight to Home after. No tour, no carousel.
- Just in time tips, each once, inline and dismissible, on Home only, one per session: quick add syntax on first use, `- [ ]` on the first note, streak rules on the first check in, keyboard shortcuts after a few desktop sessions. Needs `seenTips` in prefs.
- Respect don't disturb rules: nothing while typing.

## Known issues
- Greeting without a name (L1).

## How to test (once built)
1. New context, `open(page, '/')`: the welcome screen shows with a name field focused on desktop (not auto focused on touch unless it is a typing dialog).
2. Enter a name, pick Light, continue: Home greeting has the name, `html[data-theme="light"]`, `GET /api/me` matches.
3. New context, click Skip: Home shows, reload does not show the welcome again.
4. Tips: first quick add shows the syntax tip once; dismiss; it never returns.
