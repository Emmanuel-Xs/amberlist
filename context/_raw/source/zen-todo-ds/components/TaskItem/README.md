One task row: round checkbox, title, meta line, overflow menu. Compose from shadcn `Checkbox` (restyled round) + `DropdownMenu`.

- Props: `title`, `time`, `category`, `hasNote`, `done`, `selected`, `onToggle`, `onOpen`, `onMenu`.
- Tapping the body opens the task: a full page on phones, the detail pane at `bp-lg` (mark it `selected`).
- Done tasks move under a Completed heading, strike through and turn `ink-muted`.
- Rows stack with `space-3` gaps; never put two actions on the body.
