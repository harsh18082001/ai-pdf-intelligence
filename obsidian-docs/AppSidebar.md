---
tags: [frontend, component]
---
## Purpose
The persistent left-hand app shell navigation — brand mark, upload CTA, global search/command trigger, status-filter nav, recent documents, and theme toggle. Replaces the old top `Header`. Collapses to an icon-only rail so it doesn't compete for width on dense screens.

## Key Details
- `AppSidebar({ mobileOpen, onMobileOpenChange }: AppSidebarProps)`. Renders its content twice: once inside a fixed `<aside className="hidden ... lg:flex">` (desktop) and once inside [[MobileSidebarSheet]] (mobile) — both instances render the same local `SidebarContent` sub-component so the two never drift out of sync. `SidebarContent` takes a `collapsed: boolean` prop; the mobile sheet always renders it expanded (`collapsed={false}`) — collapsing is a desktop-only affordance.
- **Collapsible rail**: `collapsed` state (`useState`, initialized from and persisted to `localStorage['dociq-sidebar-collapsed']`) toggles the `<aside>` between `w-64` (expanded, labels/counts/Recent list visible) and `w-[68px]` (icon-only rail). A `MaybeTooltip` helper wraps every interactive icon in a `Tooltip` (`components/ui/tooltip.tsx`, the `radix-ui`-bundled primitive) showing its full label — but only `show={collapsed}`, so expanded mode renders no redundant tooltips. Added specifically because [[DocumentPage]] is a dense, scrolly workspace where a fixed 256px sidebar was worth being able to reclaim — see [[Known-Issues-and-Conventions#The sidebar collapses to an icon rail — added specifically for content-dense pages like DocumentPage]]. It's a manual, cross-route preference, not automatic per-page collapsing. **Kept on [[DocumentPage]] too, deliberately** — see [[Known-Issues-and-Conventions#DocumentPage keeps the full sidebar, not a stripped-down version (rethought, kept as-is)]].
- **Toggle is one persistent edge-mounted button**, not two swapping ones: a small circular button `position: absolute -right-3 top-6` on the `<aside>` itself (outside `SidebarContent`), with a single `ChevronLeft` icon that rotates 180° via `transition-transform` rather than swapping to a different icon/element. Labels/counts inside `SidebarContent` never mount/unmount on toggle — they're always rendered via the `SidebarLabel` helper, which animates `max-width`/`opacity` (not `display`), while icons stay pinned at a fixed left offset (`justify-start` always, never conditionally re-centered). This is a deliberate fix for an earlier version that unmounted labels and swapped buttons, which produced a visible text "flash" — see [[Known-Issues-and-Conventions#The sidebar collapse/expand had a text "flash" — fixed by not unmounting labels]]. Don't reintroduce `{!collapsed && <span>}`-style conditional label rendering.
- **Status nav icons are color-coded by tone** (`STATUS_NAV[].tone`: `text-success`/`text-info`/`text-warning`/`text-destructive`/`text-muted-foreground`), not all muted-gray — part of a broader pass to make semantic color more visible across the app rather than everything defaulting to `primary` or gray. Brand mark is a `from-primary to-secondary` gradient badge, not solid `primary`. See [[Known-Issues-and-Conventions#The palette is genuinely multi-color now, not just a different single hue (colorfulness feedback)]].
- Owns the `⌘K`/`Ctrl K` global keyboard listener (`useEffect` on `window`, `(metaKey || ctrlKey) && key === 'k'`) that toggles [[command-palette]]'s open state — this lives here (not in `Layout`) because `AppSidebar` is always mounted exactly once regardless of screen size.
- Status nav items (`STATUS_NAV`: Ready/Processing/Needs OCR/Failed/Pending) are `<Link to={`/?status=${status}`}>` — real navigation, not a filter callback — with a live count per status computed via `useMemo` over `useGetDocumentsQuery()` (`bucketOf()` maps any non-`completed`/`processing`/`failed`/`ocr_required` status to `pending`, mirroring [[document-status]]'s default case). "All Documents" links to bare `/`.
- The active item gets a `framer-motion` `layoutId="sidebar-active-pill"` background — switching between nav items animates the highlight sliding rather than popping. `isHome = location.pathname === '/'`; `activeStatus` comes from `useSearchParams().get('status')`.
- Renders [[useRecentDocuments]]'s list under a "Recent" heading (only when non-empty) and the theme `DropdownMenu` (same Light/Dark/System items the old [[Header]] had) at the bottom.
- The `⌘K`/`Ctrl K` kbd hint label is computed once from `navigator.platform` (`⌘K` on Mac, `Ctrl K` elsewhere) — cosmetic only, the keydown handler accepts either `metaKey` or `ctrlKey`.
- Also renders [[command-palette]] itself (`<CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />`), so callers of `AppSidebar` don't need to think about it.

## Source
`client/src/components/layout/AppSidebar.tsx`

## Dependencies
- Imports: [[documentApi]] (`useGetDocumentsQuery`), [[useRecentDocuments]], [[theme-provider]] (`useTheme`), [[UploadModal]] (custom `trigger`), [[command-palette]], [[MobileSidebarSheet]], the `Button`/`DropdownMenu` ui primitives, the `StatusFilter` type from [[DocumentToolbar]].
- Used by: [[Layout]] (renders it once, passes down `mobileOpen`/`onMobileOpenChange`).

## Related
- [[Layout]]
- [[TopBar]]
- [[MobileSidebarSheet]]
- [[command-palette]]
- [[useRecentDocuments]]
- [[HomePage]]
- [[DocumentPage]]
- [[DocumentCard]]
- [[Header]] (retired — this replaces it)
- [[Frontend-Architecture#App shell — sidebar navigation, not a top header (redesign pass)]]

## Notes
`useGetDocumentsQuery()` is called here, in [[HomePage]] (for stats), and in [[DocumentList]] (for the grid) — all three share one RTK Query cache entry/network request, not three separate fetches. If you add a fourth consumer, the same applies; don't add manual caching on top of it.
