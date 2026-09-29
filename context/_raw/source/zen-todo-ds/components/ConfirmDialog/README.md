Confirmation for destructive actions that Undo can't cover. Says exactly what will happen; Cancel is focused first.

- Props: `title`, `text`, `confirmLabel`, `confirmIcon`, `cancelLabel`, `confirmText` (type-to-confirm for irreversible actions), `onConfirm`, `onCancel`.
- Render it inside shadcn `AlertDialog` for the overlay and focus trap.
- Deleting a single task or note never uses this: use Undo instead.
