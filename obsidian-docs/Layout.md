---
tags: [frontend, component]
---
## Purpose
App shell root: renders the sidebar navigation, the routed page (with a transition), and the global toast container.

## Key Details
- `export function Layout()` — no props. This is the element for the root `/` route in `App.tsx`; all pages render inside it.
- Structure: a flex row of [[AppSidebar]] (fixed column on desktop, a slide-over sheet on mobile) + a flex column containing [[TopBar]] (mobile-only hamburger bar, `lg:hidden`) and a `<main>` that renders [[PageTransition]] (which itself renders the current route's `<Outlet>` content, animated).
- Owns `mobileNavOpen: boolean` state, passed down to both [[AppSidebar]] (to control its [[MobileSidebarSheet]]) and [[TopBar]] (to open it) — this is the one piece of shell state that has to live above both. Resets to `false` on every route change via a `useEffect` keyed on `location.pathname`, so navigating closes the mobile drawer automatically.
- Renders shadcn/ui `Toaster` (from `sonner`, positioned `bottom-right`) once, globally, so any component can call `toast.success/error(...)` without mounting its own toaster.
- No longer renders a top `Header` — that component was deleted; see [[Header]] (retired) and [[AppSidebar]].
- **Root shell is `h-screen overflow-hidden`, not `min-h-screen`** — this is load-bearing, not a style preference. `min-h-screen` is a floor, not a cap: if a page's content (e.g. [[DocumentPage]]'s stacked mobile layout, or a long [[DocumentList]] grid) grows taller than the viewport, an uncapped flex row's default `align-items: stretch` drags every sibling — including [[AppSidebar]]'s `<aside>` — up to match that taller height, so the sidebar visibly stretches past the viewport instead of staying pinned. `h-screen` + `overflow-hidden` on the root, plus `min-h-0` on the inner flex column and on `<main>`, forces `<main>`'s own `overflow-auto` to be the only scroll container. See [[Known-Issues-and-Conventions#The sidebar was stretching taller than the viewport (min-h-screen vs h-screen)]].

## Source
`client/src/components/layout/Layout.tsx`

## Dependencies
- Imports: [[AppSidebar]], [[TopBar]], [[PageTransition]], shadcn `Toaster` (`@/components/ui/sonner`).
- Used by: `App.tsx` as the wrapping route element for `HomePage` and `DocumentPage`.

## Related
- [[AppSidebar]]
- [[TopBar]]
- [[PageTransition]]
- [[Frontend-Architecture#App shell — sidebar navigation, not a top header (redesign pass)]]

## Notes
If you add a new top-level page, it must be nested under this route in `App.tsx` to get the sidebar/toaster/transition — a page mounted outside this tree will render without any of it.
