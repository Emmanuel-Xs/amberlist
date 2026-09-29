Pill button for every action; `primary` (amber) is the one main action per view. Maps to shadcn `Button`.

- Props: `variant` primary | secondary | outline | ghost | danger, `size` sm | md | lg, `icon`, `block`, plus any button attribute. Icon only buttons need `aria-label`.
- One primary per screen: Create task, Save changes. Cancel is `secondary`, See all is `ghost`.
- `lg` + `block` for the form submit on phones; `md` inline on tablets and laptops.
- Don't: amber text buttons on light backgrounds (use `ghost`, whose label is `ink`).
