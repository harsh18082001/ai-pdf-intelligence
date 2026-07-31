---
tags: [frontend, component]
---
## Purpose
Slim mobile-only top bar: hamburger button to open the sidebar drawer, plus a compact brand mark. Invisible at desktop widths.

## Key Details
- `TopBar({ onOpenMobileNav }: TopBarProps)` — `onOpenMobileNav: () => void`, called on hamburger click; the actual open/close state lives in [[Layout]] (passed down to both this and [[AppSidebar]]).
- Root element is `lg:hidden` — renders nothing visible at desktop widths (still in the DOM, just `display: none`), where [[AppSidebar]]'s fixed desktop column takes over navigation entirely.
- Uses `.glass` (the same backdrop-blur utility the old [[Header]] used) and is `sticky top-0` — the only other place `.glass` is used besides [[AppSidebar]]'s parent context.
- Brand mark icon is a `from-primary to-secondary` gradient badge (matches [[AppSidebar]]'s brand mark and the favicon) rather than solid `primary` — part of making the brand identity itself feel less single-hue.

## Source
`client/src/components/layout/TopBar.tsx`

## Dependencies
- Imports: `react-router-dom`'s `Link`, `lucide-react` (`Menu`, `FileText`), the `Button` ui primitive.
- Used by: [[Layout]] (rendered above `<main>`, alongside [[AppSidebar]]).

## Related
- [[Layout]]
- [[AppSidebar]]
- [[MobileSidebarSheet]]

## Notes
Doesn't render a search trigger or theme toggle of its own — those live inside the drawer content ([[AppSidebar]]'s `SidebarContent`), reachable once the hamburger opens it. Keeping this bar minimal was deliberate, not an oversight.
