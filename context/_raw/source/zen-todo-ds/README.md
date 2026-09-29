A calm, dark first task and notes app system: charcoal surfaces, one amber accent, pastel category tiles and pill shapes everywhere. Built for React + TanStack Start + Tailwind v4 + shadcn/ui, and laid out mobile first so the same screens work on phones, tablets and laptops.

## Content fundamentals

- Speak to the user as "you", warm and short: "Good morning, Emmanuel!", "You have **4 tasks** today." Highlight the number in `accent-ink`.
- Sentence case for everything: headings, buttons, chips ("Create task", "See all", "Daily tasks").
- Buttons are verbs: Create task, Save changes, Add tag. Empty states say what to do next: "No tasks yet. Tap Add to create one."
- Times read "10:00 to 10:30". Dates read "10 July 2025". No emoji in UI copy.

## Color

- Dark is the default theme (the first theme); Light mirrors it. Toggle with a `.dark` class on `<html>` and respect `prefers-color-scheme` on first load.
- Grounds step up in lightness: `bg` (page) → `surface` (cards, rows, nav) → `surface-raised` (filled inputs, hovers, unselected date pills).
- `accent` amber is a FILL only: the primary button, selected chip, selected date, progress fill, switch on. Text on it is `on-accent`. When amber must be text or an icon (See all, the task count, active nav, percent), use `accent-ink`; in light mode it darkens so it stays readable.
- Categories get one pastel each: `lavender`, `butter`, `mint`, `peach`, `sky`, always with `on-pastel` text. Pastels are for category tiles only, never for buttons or status.
- `success` and `danger` always come with an icon or word (check, Done, Overdue); they are never told apart by color alone.
- `line` for quiet dividers; `line-strong` for anything the user must see as a control (input underline, chip outline, empty checkbox).

## Type

- Poppins everywhere (Google Fonts, 400/500/600/700). In TanStack Start add the stylesheet link in the root route `head()`, or install `@fontsource/poppins`.
- Greeting uses `display` on phones and tablets, `display-lg` from `bp-lg`. Screen titles `title`, section headings `heading`, task titles `body-strong`, notes `body`, meta `body-sm`, field labels and chips `label`, nav labels `caption`.
- Never go below 11px; inputs stay at 15px or more so iOS doesn't zoom on focus.

## Shape, space and depth

- Pills (`radius-full`) for buttons, chips, search, date pills, switches, progress bars. `radius-lg` for task rows and habit cards, `radius-xl` for category tiles and dialogs, `radius-md` for filled inputs.
- Spacing on a 4px base: `space-3` between rows, `space-6` between sections. Page gutter grows with the screen: `space-4` phone, `space-6` tablet, `space-8` laptop.
- Dark mode shows depth through the surface steps; light mode adds `shadow-card`. Floating things (bottom bar, sheets, dialogs) use `shadow-float`.
- Every tap target is at least `layout-tap` (44px).

## Responsive layout

Mobile first, breakpoints match Tailwind v4 defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280).

| Screen | Nav | Content | Task detail and notes |
| --- | --- | --- | --- |
| Phone, below `bp-md` | Bottom bar, 5 items, Add in the middle, fixed with safe area inset | One column, category tiles scroll sideways, filter chips scroll sideways | Its own route (`/tasks/$id`), full screen, back arrow in the top bar |
| Tablet, `bp-md` to `bp-lg` | Left rail, `layout-nav-rail` wide, icon over label | One wider column; category tiles 3 to 4 across; week date strip fits without scrolling | Its own route, or a right `Sheet` |
| Laptop, `bp-lg` up | Sidebar, `layout-sidebar` wide, brand on top | Middle column list | Always visible right pane, `layout-detail` wide; clicking a row selects it |
| Wide, `bp-xl` up | Sidebar | Shell stops at `layout-content-max` and centers | Right pane |

- Build it with `AppShell` + `AppNav layout="auto"`; they switch shape with CSS only, no JS width checks.
- Create task: full screen form on phones, a `Dialog` (max width 560px, `radius-xl`) from `bp-md`.
- Filters: a bottom `Sheet` on phones, a `Popover` from `bp-md`.
- Test at 360, 390, 768, 1024 and 1440 wide.

## Motion

- Short and soft: 150 to 200ms ease out for hovers, the switch thumb and the selected date growing. Checking a task: fill the circle, then slide the row into Completed.
- Honor `prefers-reduced-motion` by dropping transitions.

## Scrollbars

- Pill thumbs (`radius-full`, 6px visible inside a 12px gutter) in `line-strong` at rest, turning `accent` amber on hover and while dragging, on a transparent track. Firefox gets `scrollbar-width: thin` in `line-strong`, amber while hovering a `.zn-scroll` pane.
- Scrolling panes (task list, detail pane, scratchpad, sheets) use `.zn-scroll`, which also reserves the gutter so content doesn't jump.
- Sideways rows (filter chips, folder cards, the date strip) hide the bar with `.zn-scroll-x-hidden` and rely on snap and a peek of the next item.
- Never hide the vertical scrollbar of a main list.

## Focus and accessibility

- Every interactive element shows a 2px solid `ring` outline with 2px offset on `:focus-visible`. `ring` is amber on dark and deep amber on light, 3:1 or better on every surface.
- Text pairs meet 4.5:1 in both themes: `ink` and `ink-muted` on `bg`, `surface`, `surface-raised`; `accent-ink` on `bg` and `surface`; `on-accent` on `accent`; `on-pastel` on every pastel.

## Modals and overlays

- One overlay at a time. Every overlay dims the page with `scrim`, traps focus, closes on Esc, and returns focus to what opened it.
- `Dialog` (shadcn `Dialog`) for short forms: edit folder, keyboard shortcuts, the guest merge prompt. Max 520px wide, `radius-xl`, centered from `bp-md`.
- `Sheet` (shadcn `Sheet`/`Drawer`): bottom sheet on phones for create task and filters, with a grip and swipe down to close; right sheet on tablets for the scratchpad.
- `Popover` for filters and pickers on desktop, anchored to the button that opened it, no scrim.
- `Tooltip` only on icon-only buttons, with the keyboard shortcut; never the only place information lives.
- `ConfirmDialog` only for destructive actions Undo can't cover.

## Contrast

Every pair below is checked in both themes (WCAG 2.2 AA): text 4.5:1, controls, icons, focus rings and state edges 3:1.

- Text: `ink` and `ink-muted` on `bg`, `surface`, `surface-raised`, `accent-soft`; `accent-ink` on `bg`, `surface`, `surface-raised`, `accent-soft`; `danger` on `bg`, `surface`, `surface-raised`, `danger-soft`; `success` on `bg`, `surface`, `surface-raised`; `on-accent` on `accent`; `on-danger` on `danger`; `on-pastel` on every pastel.
- Controls: `line-strong` and `ring` on `bg`, `surface`, `surface-raised`.
- Amber is pale against the light page (1.6:1), so any amber fill that shows a state (selected chip, switch on, selected date) also draws a 1.5px `accent-edge`. Primary buttons don't need it: their label carries them.
- Muted text on pastel cards is `on-pastel` at 74% opacity, 4.5:1 or better on every pastel.

## Toasts, sounds and confetti

- **Toasts** confirm what just happened in one line, with Undo when it can be undone. Neutral, success and error tones; a 3px countdown bar shows the 4 seconds and pauses on hover or focus. Stack at most 3 in a `Toaster`: bottom center above the nav bar on phones, bottom left beside the sidebar on desktop. Errors stay until dismissed.
- **Sounds** are short synthesized tones (`Zen.sound`), quiet (6% volume), and only follow something the user did:

| Sound | When |
| --- | --- |
| complete | Ticking a task or subtask, a habit check in |
| undo | Pressing Undo |
| delete | Deleting a task or note |
| error | A save or load fails |
| celebrate | Finishing everything due today, reaching a habit goal |

  A **Sounds** switch in Profile turns them all off (`Zen.sound.enable(false)`); remember the choice. Never play a sound on page load.
- **Confetti** (`Zen.confetti`) is rare on purpose: finishing the last task due today, completing a long running task, or reaching a habit goal like 21 of 21. Never for a single ordinary task. It is skipped entirely under reduced motion, and the celebrate sound plus the "All done" empty state still say it.

## Destructive actions and errors

Match the friction to how bad a mistake would be:

| Level | Examples | Pattern |
| --- | --- | --- |
| Reversible | Complete a task, delete a task, subtask or note | Act at once, then a `Toast` with Undo for 4 seconds. No dialog. |
| Big but safe | Delete a folder (its tasks move to Inbox), discard a guest's data on merge | `ConfirmDialog` that says exactly what happens, `danger-solid` confirm. |
| Irreversible | Delete all my data | `ConfirmDialog` with `confirmText="DELETE"`; the button stays disabled until it matches. |

- Delete sits last in every `Menu`, after a separator, in `danger` with the trash icon.
- In dialogs, Cancel is focused first and Esc cancels. The destructive button is never the default.
- Outline `danger` buttons start a destructive flow; only the final confirm is `danger-solid` on `on-danger`.
- Errors: a failed save or load shows an `Alert` tone danger with Retry, inline where it failed. Background failures use a `Toast` ("Couldn't save your note", Retry). Field errors sit under the field. Every error has an icon and words, never color alone.

## Iconography

- Use `lucide-react` (shadcn's default): 24px grid, 1.75 stroke, round caps. 20px in rows and fields, 22px in nav, 16px in chips.
- The system's `Icon` names map one to one to lucide-react. In the app import from `lucide-react`:

| Icon name | lucide-react | Used for |
| --- | --- | --- |
| home, tasks, note, flame, folder | `House`, `ListTodo`, `NotebookPen`, `Flame`, `Folder` | Main navigation |
| plus, search, sliders, more, x | `CirclePlus`, `Search`, `SlidersHorizontal`, `EllipsisVertical`, `X` | Add, search, filters, overflow menu, close |
| calendar, clock, flag, bell, inbox | `Calendar`, `Clock`, `Flag`, `Bell`, `Inbox` | Start date, time, due date and priority, reminders, undated tasks |
| check, play, pin, link, scratch | `Check`, `Play`, `Pin`, `Link`, `PencilLine` | Done, start, pinned note, linked note, scratchpad |
| trash, alert, refresh, undo | `Trash2`, `TriangleAlert`, `RotateCw`, `Undo2` | Delete, errors, retry, undo |
| download, copy, logout, arrowLeft, chevronRight, chevronDown | `Download`, `Copy`, `LogOut`, `ArrowLeft`, `ChevronRight`, `ChevronDown` | Export, duplicate, sign out, back, disclosure |
| user, moon, sun, book, pen, droplet, target, cart, menu | `User`, `Moon`, `Sun`, `BookOpen`, `PenTool`, `Droplet`, `Target`, `ShoppingCart`, `Menu` | Profile, theme, folder and habit icons |

- Sizes: 16 in chips and toasts, 18 in menus and fields, 20 in rows and buttons, 22 in navigation, 24 to 56 in cards. Stroke 1.75 (1.25 at 44px and up).
- Icons inherit `currentColor`; an icon alone carries meaning only with an `aria-label` on its button.
- No illustrations ship with the system. Category tiles use one large line icon; drop in your own illustrations later if you like.

## Using it with shadcn/ui and Tailwind v4

Paste this into `src/styles/app.css` (TanStack Start), then `npx shadcn@latest init` keeps these names. Components pick them up as `bg-background`, `text-muted-foreground`, `bg-primary`, `bg-lavender` and so on.

```css
@import "tailwindcss";
@import "tw-animate-css";
@custom-variant dark (&:where(.dark, .dark *));

:root {
  --radius: 1.25rem;
  --background: #f4f3ef; --foreground: #1c1d21;
  --card: #ffffff; --card-foreground: #1c1d21;
  --popover: #ffffff; --popover-foreground: #1c1d21;
  --primary: #fdb833; --primary-foreground: #1c1d21;
  --secondary: #eceae4; --secondary-foreground: #1c1d21;
  --muted: #eceae4; --muted-foreground: #5e5f66;
  --accent: #fcebc4; --accent-foreground: #8a5c00;
  --destructive: #b42318; --success: #1b7035;
  --border: #e2e0d9; --input: #7f7e79; --ring: #8a5c00;
  --brand-ink: #8a5c00;
  --lavender: #e2c8fb; --butter: #fce7a6; --mint: #c4f1cb; --peach: #ffd2bd; --sky: #c3e1fb; --on-pastel: #1c1d21;
}
.dark {
  --background: #1c1d21; --foreground: #f5f5f4;
  --card: #2a2b30; --card-foreground: #f5f5f4;
  --popover: #2a2b30; --popover-foreground: #f5f5f4;
  --primary: #fdb833; --primary-foreground: #1c1d21;
  --secondary: #34353b; --secondary-foreground: #f5f5f4;
  --muted: #34353b; --muted-foreground: #a1a1aa;
  --accent: #3a3020; --accent-foreground: #fdb833;
  --destructive: #ff8a7a; --success: #6fd08c;
  --border: #3a3b42; --input: #80818a; --ring: #fdb833;
  --brand-ink: #fdb833;
  --lavender: #d9b8f7; --butter: #fae3a0; --mint: #bdefc5; --peach: #ffc6ae; --sky: #b7dafa; --on-pastel: #1c1d21;
}

@theme inline {
  --font-sans: "Poppins", ui-sans-serif, system-ui, sans-serif;
  --color-background: var(--background); --color-foreground: var(--foreground);
  --color-card: var(--card); --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover); --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary); --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary); --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted); --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent); --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive); --color-success: var(--success);
  --color-border: var(--border); --color-input: var(--input); --color-ring: var(--ring);
  --color-brand-ink: var(--brand-ink);
  --color-lavender: var(--lavender); --color-butter: var(--butter); --color-mint: var(--mint);
  --color-peach: var(--peach); --color-sky: var(--sky); --color-on-pastel: var(--on-pastel);
  --radius-sm: 10px; --radius-md: 14px; --radius-lg: 20px; --radius-xl: 28px;
}

@layer base {
  * { @apply border-border outline-ring; }
  body { @apply bg-background text-foreground font-sans antialiased; }
}
```

Token to shadcn name: `bg` → background, `surface` → card and popover, `surface-raised` → muted and secondary, `accent` → primary, `on-accent` → primary-foreground, `accent-soft` → accent, `accent-ink` → brand-ink (and accent-foreground), `line` → border, `line-strong` → input, `ring` → ring, `danger` → destructive.

Tell your coding agent in AGENTS.md: "Use only the theme colors above; never raw hex or Tailwind palette colors like `amber-400`. Primary action is `bg-primary text-primary-foreground rounded-full`. Amber text is `text-brand-ink`. Build mobile first and check 360, 768 and 1280 widths."
