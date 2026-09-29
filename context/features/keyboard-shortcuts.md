# Keyboard shortcuts

## Purpose
Desktop power use: capture and navigate without the mouse.

## Status
Partly built. `/` search and `G F` from the PRD are missing; Q is hard to discover (L22).

## How it works now
- Registered in `AppShell` (`src/components/AppShell.tsx`) with TanStack Hotkeys (`useHotkey`, `useHotkeySequence`), which ignore key presses while typing in fields:
  - `Q`: focus `#quick-add` if it is on the page, else open the full task form.
  - `C`: open the full task form (dialog "New task").
  - `N`: open the scratchpad, unless `G` was pressed in the last second (so `G N` does not also open it; fixed in c314e6b).
  - `Shift+/` (`?`): open the "Keyboard shortcuts" dialog.
  - `G H` Home, `G T` Tasks, `G N` Notes.
  - `Esc`: closes any `Modal` (and menus) via their own key handlers.
- Sheet: `Shortcuts` in the same file lists these eight rows. Also opened from Profile "Keyboard shortcuts (?)".
- Hints: `Q` kbd in the quick add (tablet up), `N` kbd beside Scratchpad in the sidebar.
- Menus support ArrowUp and ArrowDown (`MenuButton` in `src/ui/zen.tsx`).

## Planned per PRD
- `/` focuses search, `G F` goes to Folders.
- Shortcuts tip after a few desktop sessions.
- Tooltips on icon buttons that include the shortcut (L14).

## Known issues
- `/` and `G F` do nothing.
- The `G` tracker is a raw keydown listener that also counts a "g" typed in a field (harmless: `N` is ignored in fields anyway).

## How to test (desktop project)
1. `open(page, '/tasks')`, click the heading, press `q`: `#quick-add` is focused. On `/notes` press `q`: dialog "New task" opens.
2. Press `c`: dialog "New task"; `Escape` closes it.
3. Press `n`: dialog "Scratchpad". `Escape`.
4. Press `Shift+/`: dialog "Keyboard shortcuts" with 8 rows.
5. Press `g` then `t`: URL `/tasks`; `g` then `n`: URL `/notes` and no Scratchpad dialog; `g` then `h`: URL `/`.
6. Focus `#quick-add`, type "quick note": no shortcut fires, the text is typed.
