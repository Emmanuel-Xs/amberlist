Short confirmation with an optional Undo, shown bottom center on phones and bottom left on desktop. Replaces confirm dialogs for complete and delete.

- Props: `message`, `icon`, `actionLabel` (usually Undo), `onAction`, `onClose` (`null` hides the close button).
- Auto dismiss after 4 seconds; pause on hover and focus. Announced politely to screen readers.
- One toast at a time; a new one replaces the old.
