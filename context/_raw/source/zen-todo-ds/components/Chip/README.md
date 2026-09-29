Toggleable pill for filters and category tags. Maps to shadcn `Toggle` (or `ToggleGroup` for a filter row).

- Props: `selected`, `icon`, `onClick`, children label.
- Filter rows scroll horizontally on phones (`overflow-x: auto`, no scrollbar) and wrap from `bp-md` up.
- Only one selected in a filter row; multiple allowed when picking tags on the create form.
