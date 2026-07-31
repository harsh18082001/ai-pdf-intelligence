---
tags: [frontend, component]
---
## Purpose
Route-level enter/exit animation — fades/slides the current page's content when navigating between routes.

## Key Details
- `export function PageTransition()` — no props. Reads `useLocation()` and `useOutlet()` from react-router-dom.
- `useOutlet()` returns the currently-matched route's element (equivalent to what `<Outlet />` would render) so it can be wrapped in a `framer-motion` `motion.div` and given a `key={location.pathname}` — this key change is what tells `AnimatePresence` a route transition happened, so it runs the exit animation on the old page and the enter animation on the new one (`mode="wait"`, `initial={false}` so it doesn't animate on first load).
- Rendered inside [[Layout]]'s `<main>`, replacing a bare `<Outlet />`.
- Because this now owns the page-level enter animation, [[HomePage]] and other pages should **not** also apply their own `animate-fade-in`/`animate-fade-in-up` CSS classes to their root element — doing so would double-animate (CSS keyframe + framer-motion opacity stacking).

## Source
`client/src/components/layout/PageTransition.tsx`

## Dependencies
- Imports: `framer-motion` (`AnimatePresence`, `motion`), `react-router-dom` (`useLocation`, `useOutlet`).
- Used by: [[Layout]].

## Related
- [[Layout]]
- [[HomePage]]
- [[DocumentPage]]

## Notes
`useOutlet()` must be called from a component actually rendered inside the matching `<Route element={...}>` tree (i.e. inside `Layout`, which is exactly where this is used) — calling it elsewhere returns `null`.
