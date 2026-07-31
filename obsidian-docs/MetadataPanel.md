---
tags: [frontend, component, retired]
---
## Purpose
**Retired.** `client/src/components/documents/MetadataPanel.tsx` was deleted during the DocumentPage workspace redesign and no longer exists.

## Key Details
This used to be a card-based panel (title/date/size/pages/status fields in a grid, an error callout, and three stacked AI-action buttons) rendered above [[ChatInterface]] in a narrow resizable pane. Direct user feedback described the result as visually "compressed"/"congested" — too many stacked boxes in too little width. It was merged into [[DocumentHeader]]: a single slim horizontal strip (breadcrumb + title + status badge + inline date/size/page chips + one "Actions" dropdown) that also absorbed [[PageHeader]] (also retired) — freeing the entire left resizable pane for [[ChatInterface]] alone.

## Source
Deleted. Was `client/src/components/documents/MetadataPanel.tsx`.

## Dependencies
N/A — nothing imports this anymore (verified via grep before deletion).

## Related
- [[DocumentHeader]]
- [[PageHeader]] (also retired)
- [[DocumentPage]]
- [[Known-Issues-and-Conventions#DocumentPage was rebuilt because the workspace felt "compressed" (congestion feedback)]]

## Notes
If you're reading this from an old link: go to [[DocumentHeader]] for the current title/status/metadata/AI-actions code.
