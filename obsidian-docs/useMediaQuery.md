---
tags: [frontend, hook]
---
## Purpose
Small reactive `window.matchMedia` wrapper — returns whether a CSS media query currently matches, and re-renders the caller when it changes.

## Key Details
- `useMediaQuery(query: string): boolean`, e.g. `useMediaQuery('(min-width: 1024px)')`.
- Initializes state synchronously from `window.matchMedia(query).matches` (guarded for SSR/non-browser contexts, though this app has no SSR), then subscribes via `addEventListener('change', ...)` on the `MediaQueryList`.

## Source
`client/src/hooks/useMediaQuery.ts`

## Dependencies
- No imports beyond React itself.
- Used by: [[DocumentPage]] (`'(min-width: 1024px)'`, gating the resizable-panels layout vs. the stacked mobile layout — matches Tailwind's `lg` breakpoint).

## Related
- [[DocumentPage]]

## Notes
The breakpoint string is duplicated as a literal (`'(min-width: 1024px)'`) rather than reading from a shared Tailwind config value, because Tailwind v4's config is CSS-first (`@theme` in `index.css`, no `tailwind.config.js` to import from JS) — if the `lg` breakpoint ever changes, this string needs updating by hand alongside it.
