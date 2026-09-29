Shimmering placeholder shaped like the content that is loading. Use for first loads over 300ms; never a spinner for page content.

- Props: `width`, `height`, `radius`.
- Match the real layout: a task row skeleton is a 22px circle plus two bars inside a `radius-lg` row.
- The shimmer stops with `prefers-reduced-motion`. Wrap the loading region in `aria-busy="true"`.
