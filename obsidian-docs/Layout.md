---
tags: [frontend, component]
---
## Purpose
App shell: renders [[Header]], the routed page via `<Outlet>`, and the global toast container.

## Key Details
- `export function Layout()` — no props. This is the element for the root `/` route in `App.tsx`; all pages render as its `<Outlet>`.
- Renders shadcn/ui `Toaster` (from `sonner`, positioned `bottom-right`) once, globally, so any component can call `toast.success/error(...)` without mounting its own toaster.

## Source
`client/src/components/layout/Layout.tsx`

## Dependencies
- Imports: [[Header]], shadcn `Toaster` (`@/components/ui/sonner`).
- Used by: `App.tsx` as the wrapping route element for `HomePage` and `DocumentPage`.

## Related
- [[Header]]
- [[Frontend-Architecture#Routing table]]

## Notes
If you add a new top-level page, it must be nested under this route in `App.tsx` to get the header/toaster — a page mounted outside this tree will render without either.
