Outlined pill search with an amber filter button. Build with shadcn `Input` inside a wrapper, filter button opens a `Sheet` on phones and a `Popover` from `bp-md`.

- Props: `placeholder`, `value`, `onChange`, `onFilter` (pass `null` to hide the button), `filterLabel`.
- Searches task titles AND note text.
