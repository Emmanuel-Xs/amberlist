Centered modal for short forms and decisions: edit folder, keyboard shortcuts, the guest merge prompt. Render inside shadcn `Dialog` for the scrim, focus trap and Esc.

- Props: `title`, `description`, `wide`, `footer` (buttons, primary last), `onClose` (`null` hides the close button when a choice is required), children.
- One primary action; Cancel or a secondary choice sits before it.
