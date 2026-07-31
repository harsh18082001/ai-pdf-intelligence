---
tags: [frontend, component]
---
## Purpose
Shows document metadata (title, date, size, pages, status/error) and the three one-click AI action buttons (Summary / Key Points / Insights), displaying results in a dialog.

## Key Details
- `MetadataPanel({ documentId }: MetadataPanelProps)`
- Data: `useGetDocumentQuery(documentId)` from [[documentApi]]; `useExecuteCommandMutation()` from [[commandApi]].
- Local state: `activeCommand` (which button is loading), `isDialogOpen`, `dialogTitle`, `commandResult`.
- `handleCommand(command, title)`: opens the dialog immediately (empty content + spinner), calls `executeCommand({ documentId, command }).unwrap()`, sets `commandResult` to `result.content` on success, shows a `toast` either way. On error the dialog is closed instead of showing an error inside it.
- AI action buttons (`summary` / `key_points` / `insights`) only render when `document.status === 'completed'` — matches the three commands actually implemented server-side in [[command.service]] (`regenerate` is never passed from the UI, so it is always `false`/cache-first here).
- Renders `document.errorMsg` in a destructive callout when present (e.g. after a `failed` or `ocr_required` status).
- Status badge logic (`getStatusConfig`) is duplicated verbatim from [[DocumentCard]] — not shared.

## Source
`client/src/components/documents/MetadataPanel.tsx`

## Dependencies
- Imports: [[documentApi]] (`useGetDocumentQuery`), [[commandApi]] (`useExecuteCommandMutation`), shadcn `Card`/`Badge`/`Button`/`Dialog`, `ReactMarkdown`+`remarkGfm` for rendering `commandResult`.
- Used by: [[DocumentPage]].

## Related
- [[DocumentPage]]
- [[commandApi]]
- [[documentApi]]
- [[command.controller]]
- [[Data-Flow#5. Command flow]]

## Notes
The command buttons hard-code the three artifact types (`summary`, `key_points`, `insights`) even though the backend's `ARTIFACT_TYPES` constant lists more (`flashcards`, `quiz`, `interview_questions`, `resume_analysis`) — those are backend-only/unimplemented-in-UI. If you add a new command button here, the string passed must exactly match a value from `ARTIFACT_TYPES` in [[Backend-Architecture|server/src/config/constants.ts]] or the request 400s in [[validation]].
