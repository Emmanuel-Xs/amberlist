Responsive page frame: nav, main content and an optional detail aside.

- Props: `nav` (an AppNav), `children` (main), `aside` (task detail and notes), `asideLabel`, `layout` auto | rail | sidebar.
- `auto`: phones get one column with room for the bottom bar; `bp-md` adds the rail; `bp-lg` the sidebar plus the `layout-detail` aside.
- Below `bp-lg` the aside is hidden: open task detail as its own route (`/tasks/$id`) instead.
