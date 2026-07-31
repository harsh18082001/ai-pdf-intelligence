---
tags: [frontend, component]
---
## Purpose
Fetches and renders the grid of the current user's documents, with loading/error/empty states.

## Key Details
- `export function DocumentList()` — no props.
- Calls `useGetDocumentsQuery()` from [[documentApi]] → `{ data: documents = [], isLoading, error }`.
- Three early-return states: loading spinner, error message, empty state (shows [[UploadModal]] inline as the CTA).
- Otherwise renders a responsive grid (`1→2→3→4` columns) of [[DocumentCard]], keyed by `doc.id`.

## Source
`client/src/components/documents/DocumentList.tsx`

## Dependencies
- Imports: [[documentApi]] (`useGetDocumentsQuery`), [[DocumentCard]], [[UploadModal]].
- Used by: [[HomePage]].

## Related
- [[HomePage]]
- [[DocumentCard]]
- [[documentApi]]

## Notes
Empty-list and "no documents match this client" look identical — since `documentApi.getDocuments` returns `[]` for both a genuinely-new user and one whose `x-client-id` header failed to send, a silently-missing client ID header would present as "No documents yet" rather than an error. See [[Known-Issues-and-Conventions]] on the `x-client-id` mechanism.
