---
tags: [frontend, lib, retired]
---
## Purpose
**Retired.** This file (`client/src/lib/recent-documents.ts`) was deleted during the enterprise-auth overhaul — "recent documents" moved from a per-browser `localStorage` list to a server-tracked `Document.lastAccessedAt` field, scoped to the caller's owner (guest or user). See [[useRecentDocuments]] and [[document.service]] for the current implementation.

## Notes
Kept as a stub (not deleted outright) per this vault's convention for retired files — see `000-Home.md`'s "(retired)" entries. If you find a reference to `getRecentDocuments`/`pushRecentDocument`/`dociq-recent-documents` anywhere, it's stale.

## Related
- [[useRecentDocuments]]
- [[document.service]]
- [[Known-Issues-and-Conventions#Auth is now real: email/password + server-issued guest sessions]]
