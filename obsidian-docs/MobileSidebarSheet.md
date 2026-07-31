---
tags: [frontend, component]
---
## Purpose
The slide-over drawer that shows [[AppSidebar]]'s content on mobile, triggered by [[TopBar]]'s hamburger button.

## Key Details
- `MobileSidebarSheet({ open, onOpenChange, children }: MobileSidebarSheetProps)`.
- **Deliberately not built on Radix `Dialog`** (unlike every other overlay in this app — `dialog.tsx`, `alert-dialog.tsx`, [[command-palette]]). It's a hand-rolled overlay + `framer-motion` `AnimatePresence`/`motion.div` (slide from `x: '-100%'` to `0`, spring transition), plus a manual `Escape`-key listener and a `document.body.style.overflow = 'hidden'` lock while open.
- Reason for not using Radix here: this was built alongside a discovery that the project's `animate-in`/`fade-in-0`/`zoom-in-95` Tailwind classes (used by the Radix-based dialogs) had no CSS backing at all until `tw-animate-css` was added (see [[Known-Issues-and-Conventions]]) — this component was written to guarantee a working slide animation independent of that, via `framer-motion` directly rather than CSS utility classes.
- No focus trap / `aria-describedby` wiring beyond `role="dialog"` + `aria-modal="true"` — simpler than Radix's Dialog primitive, acceptable for a nav drawer but worth knowing if accessibility requirements tighten later.

## Source
`client/src/components/layout/MobileSidebarSheet.tsx`

## Dependencies
- Imports: `framer-motion` (`AnimatePresence`, `motion`), `lucide-react`'s `XIcon`.
- Used by: [[AppSidebar]] (wraps its `SidebarContent` for the mobile case).

## Related
- [[AppSidebar]]
- [[TopBar]]
- [[Layout]]
- [[Known-Issues-and-Conventions#Fonts are self-hosted, not CDN-loaded (UI polish pass)]]

## Notes
If Radix's Dialog primitive is ever preferred here for consistency (e.g. to get its focus trap for free), the styling would need converting from `motion.div`/`AnimatePresence` to Radix's `data-state`-driven classes — don't assume they compose directly with each other, they're two different animation control mechanisms.
