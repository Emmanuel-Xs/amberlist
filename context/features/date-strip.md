# Date wheel (calendar)

## Purpose
Pick a day on Home and see that day's tasks; today is marked. Replaces the old fixed week DateStrip.

## Status
Done (2026-09-30). Round 3 board 16 approved by Emmanuel with two fixes: the month picker on phones gets a spacious bottom sheet, and tapping a card selects it and spins it to the centre. Closes L11 and O6.

## How it works
- `DateWheel` in `src/components/DateWheel.tsx`, styles `.dw-*` appended to `src/styles.css`. Home renders `<DateWheel value={day} onChange={setDay} />` (same value/onChange contract as DateStrip) when any task has a start or due date. DateStrip was removed from `Cards.tsx` (`.zn-date*` CSS stays in `zen.css` as DS reference).
- Days sit on a 3D cylinder: each card `rotateY((i - rot) * theta) translateZ(R)`, the cylinder `translateZ(-R)`, perspective 900px. Phone (under 768): cards 54 wide, gap 8, theta 13deg; tablet and up: 64, 12, 9.5deg. Cards radius 14, fade with `cos(angle)`, back faces hidden.
- One motion value `rot` (days from today) drives every card through `useTransform`; React only re-renders when the centred day changes or the rendered window (about ±11 to 14 days around the centre) shifts every 3 days. `will-change` only on the cylinder.
- Selected card: amber fill, on-accent text, grows taller (face `scaleY(1.21)`, transform only). Today, when not selected: accent-ink ring. Dot for days with open tasks (same rule as `isOnDay`: today holds everything started on or before today).
- Range: from the oldest overdue task or 7 days back (whichever is earlier) to 3 days after the last task date (at least today + 3). Past the ends it rubber bands (30%). A dashed end card says "Nothing planned after {last task date}". The picker (or a value set from outside) can jump outside the range; the range then stretches to include that day for the session.
- Input: drag follows the finger (pointer events, capture after 6px so taps stay clicks, `touch-action: pan-y` keeps page scrolling). Release uses Motion inertia (power 0.3, timeConstant 200, target snapped to a whole day), so a fast flick travels further. Taps, keys, arrows and the picker spin with `SPRING_GLIDE`. Wheel and trackpad (horizontal or vertical) spin it and settle 120 ms after the last event. Far jumps start 14 days out so they still read as a spin.
- Header: date button (calendar icon, "Today, 30 September" or "Thursday 1 October", chevron) opens the month picker; "Today" button; previous and next week arrows from 768 up.
- Month picker: `role="dialog"`, title with prev and next month buttons, Monday first grid, 44px day cells with 6px gaps on phones (40px, 4px gaps in the popover), dots for days with tasks, "Go to today". Phones: full width bottom sheet with scrim and grip, body scroll locked. 768 up: popover under the date button, closes on outside click. Focus trap, Esc closes, focus returns to the date button, arrow keys move by day and week, Page Up and Down by month.
- Accessibility: `role="listbox"` "Pick a day" with `role="option"` cards (`aria-selected`, names like "Wednesday 1 October, 2 tasks"), roving tabindex on the centred day. ArrowLeft/Right ±1 day, PageUp/Down ±7, Home today, End last day. A polite live region announces the chosen day after each change.
- Reduced motion (`useReducedMotion`): flat strip of radius 14 tiles (`translateX`), no spin, selection jumps instantly.

## Known issues
- At 1440 the stage is wider than the cylinder, so the curve ends a little before the stage edges (as on the approved board).
- The day under the finger is highlighted live while dragging; Home only updates when the finger lifts.

## How to test
1. Seed tasks via `POST /api/tasks` (`dueDate` 3 days ago, `startDate` today, +1, +3, +6, +10), open `/`, skip the welcome.
2. `getByRole('listbox', { name: 'Pick a day' })`: the centred option is today with `aria-selected="true"`; the first rendered card is 7 days back.
3. Phone 390 touch: a fast flick travels further than a slow drag of the same distance and lands on a whole day; flicking hard stops at last task + 3 with the "Nothing planned after" card; tapping a card selects it and centres it; Home lists that day's tasks.
4. Picker at 390: full width sheet, 44px cells, focus inside, Esc closes and returns focus to the date button; picking a day next month extends the range and centres it.
5. 820 and 1440: week arrows move ±7; focus a card, ArrowRight, PageDown, Home; the live region reads the day; trackpad scroll spins; the picker is a popover and arrow keys move focus in it.
6. Reduced motion: `.dw-stage--flat`, tap selects instantly.
7. Performance (2026-09-30, headless Chromium at 390 touch): flick and tap spin ran at 16.7 ms average frame time, p95 16.7 ms, no long frames.
