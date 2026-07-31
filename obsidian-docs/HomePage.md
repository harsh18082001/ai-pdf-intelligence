---
tags: [frontend, page]
---
## Purpose
Landing page: hero banner + upload CTA + the user's document grid.

## Key Details
- `export function HomePage()` — no props, no params.
- Renders (in order): decorative gradient blobs, hero heading/subtext, [[UploadModal]], "Recent Documents" heading, [[DocumentList]].
- No local state, no data fetching of its own — all fetching is delegated to `DocumentList`.
- Routed at `/` (index route) via [[App-tsx|App.tsx]].

## Source
`client/src/pages/HomePage.tsx`

## Dependencies
- Imports: [[DocumentList]] (`@/components/documents/DocumentList`), [[UploadModal]] (`@/components/documents/UploadModal`).
- Rendered by: `App.tsx` as the index route inside [[Layout]].

## Related
- [[DocumentList]]
- [[UploadModal]]
- [[Frontend-Architecture]]

## Notes
Purely presentational — if you need to change what shows on first load, edit `DocumentList`/`UploadModal`, not this file.
