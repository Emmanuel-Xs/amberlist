Main navigation that changes shape by screen size: bottom bar on phones, rail on tablets, sidebar on laptops.

- Props: `items` [{id, label, icon, href}], `active`, `onSelect`, `brand` (shown in sidebar), `layout` auto | bar | rail | sidebar, `fixed`.
- Use `layout="auto"` with `fixed` in the app: bar below `bp-md`, rail from `bp-md`, sidebar from `bp-lg`.
- With TanStack Router, render each item as `<Link>` and read `active` from the current route.
- Five items max in the bar; Add sits in the middle.
