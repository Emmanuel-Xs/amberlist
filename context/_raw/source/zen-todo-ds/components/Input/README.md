Labelled text field; `line` (underline, the form default) or `filled`. Maps to shadcn `Input` + `Label`.

- Props: `id` (required so the label works), `label`, `optional`, `hint`, `error`, `variant`, `trailingIcon` (calendar, clock), plus input attributes.
- Label sits above in `label` style and `ink-muted`; focus turns the underline to `ring`.
- Errors: `error` + `hint` text in `danger`; never color alone.
