---
tags: [frontend, component, retired]
---
## Purpose
**Retired.** `client/src/components/layout/PageHeader.tsx` was deleted during the DocumentPage workspace redesign and no longer exists.

## Key Details
This used to be a standalone breadcrumb + back-arrow + `<h1>` row, used only by [[DocumentPage]]. It was merged into [[DocumentHeader]] along with the old `MetadataPanel` (also retired) into one compact strip, as part of fixing user feedback that the document workspace felt visually "compressed"/"congested".

## Source
Deleted. Was `client/src/components/layout/PageHeader.tsx`.

## Dependencies
N/A — nothing imports this anymore (verified via grep before deletion).

## Related
- [[DocumentHeader]]
- [[MetadataPanel]] (also retired)
- [[DocumentPage]]
- [[Known-Issues-and-Conventions#DocumentPage was rebuilt because the workspace felt "compressed" (congestion feedback)]]

## Notes
If you're reading this from an old link: go to [[DocumentHeader]] for the current breadcrumb/title code. If a future page needs a standalone "Home / X" breadcrumb without the rest of `DocumentHeader`'s metadata/actions, it may be worth re-extracting a small breadcrumb-only component rather than reviving this file verbatim — check what that future page actually needs first.
