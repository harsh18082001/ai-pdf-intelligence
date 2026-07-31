---
tags: [frontend, component, retired]
---
## Purpose
**Retired.** `client/src/components/layout/Header.tsx` was deleted during the app-shell redesign pass and no longer exists. This note is kept only so links to it (and the git history around it) resolve to an explanation instead of a dead end.

## Key Details
The old top header (logo + light/dark/system theme dropdown, nothing else) was replaced by a persistent left sidebar — see [[AppSidebar]] (desktop) and [[TopBar]] (mobile hamburger + compact brand mark, shown `lg:hidden`). The theme dropdown that used to live here now lives at the bottom of [[AppSidebar]], same `DropdownMenu`/`useTheme()` code, just relocated.

## Source
Deleted. Was `client/src/components/layout/Header.tsx`.

## Dependencies
N/A — nothing imports this anymore (verified via grep before deletion).

## Related
- [[AppSidebar]]
- [[TopBar]]
- [[Layout]]
- [[theme-provider]]

## Notes
If you're reading this from an old link: go to [[AppSidebar]] for the current logo/theme-toggle code.
