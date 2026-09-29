# Folders (categories)

## Purpose
Group tasks by area of life, shown as desktop style folder cards so the purpose is obvious.

## Status
Built for tasks. Habits and notes in folders not built.

## How it works now
- `/folders` (`src/routes/folders/index.tsx`): header "New folder", help text, `.folders-grid` of `FolderCard`s plus a dashed "New folder" tile, skeletons, empty state with a button.
- `FolderCard` (`src/components/Cards.tsx`): link named "{name} folder, {n} tasks"; tab on top, pastel ground, icon, count pill, name, bar with "X of Y done".
- `FolderDialog` (same file): "New folder" or "Edit folder", Name (autofocus, max 40), `ColorPicker` radiogroup "Folder color" (5 pastels, up to 6 custom swatches, "Add your own colour" hue panel; see notes.md; Esc in the panel closes only the panel, not the dialog), radiogroup "Folder icon" (folder, pen, book, home, target, droplet, sun, cart, flame, note). Toasts "Folder created" / "Folder updated".
- `/folders/$id` (`src/routes/folders/$id.tsx`): `TasksPage` filtered to the folder with the folder name as title, plus a menu "Actions for {name}": Edit folder, Delete folder. Delete opens `ConfirmDialog` "Delete the {name} folder?" / "Its N tasks move to Inbox. Nothing else is deleted." with "Delete folder"; toast "{name} deleted. Tasks moved to Inbox."
- Card, Today card, sidebar dot and folder colours render through `colorVar()` (`src/lib/colors.ts`), so a custom `#rrggbb` works everywhere.
- Sidebar (1024+) lists folders with a color dot and open count; "All folders" chevron link.
- Home shows a Folders row once any folder has tasks.
- API: `GET/POST /api/categories` (seeds Personal mint/home, Work butter/pen, Study lavender/book on first list), `PATCH/DELETE /api/categories/:id`. Delete sets `categoryId = null` on its tasks.
- Quick add `#name` finds or creates a folder.

## Planned per PRD
- Folder page also shows habits and notes.
- Phone: folders as a sideways row, tablet 3 to 4 columns, desktop 4 to 6 (check the grid against the canvas).

## Known issues
- Task rows inside a folder link to `/tasks/$id`, leaving the folder view.
- Folder page empty state has no button.

## How to test
1. `open(page, '/folders')`: three default folders (Personal, Work, Study).
2. Click `getByRole('button', { name: 'New folder' }).first()`, fill `getByLabel('Name')` "Gym", click radio `peach` and radio `flame`, then "Create folder". Toast "Folder created"; a card link "Gym folder, 0 tasks".
3. Quick add `Leg day #gym` on Home; the Gym card shows 1 task and Home shows the Folders row.
4. Open the card; heading "Gym"; the task is listed. Open `getByRole('button', { name: 'Actions for Gym' })`, menuitem `Edit folder`, rename "Fitness", Save: title updates.
5. Menuitem `Delete folder`: `getByRole('alertdialog', { name: 'Delete the Fitness folder?' })`, Cancel is focused first, `Escape` closes. Reopen and click the dialog's "Delete folder" button: redirected to `/folders`, toast mentions Inbox, and the task now has `categoryId: null` (Inbox group on /tasks).
6. Name empty then "Create folder": error "Name the folder."
7. Custom colour: in New folder, "Add your own colour", `getByLabel('Hue').fill('140')`, "Add colour", "Create folder". Reload: the card and sidebar dot use the custom shade. API rejects dark or garbage colours with 400.
