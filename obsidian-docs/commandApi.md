---
tags: [frontend, api]
---
## Purpose
RTK Query slice for triggering one-click AI actions (summary / key_points / insights).

## Key Details
- `interface ExecuteCommandRequest { documentId: number; command: string; regenerate?: boolean }`
- `commandApi = baseApi.injectEndpoints({ endpoints: (builder) => ({ executeCommand: builder.mutation<AIArtifactDTO, ExecuteCommandRequest>(...) }) })`
- `executeCommand({ documentId, command, regenerate })`:
  - `query: (body) => ({ url: '/commands', method: 'POST', body })` — the whole `ExecuteCommandRequest` (including `documentId`) is sent as the JSON body, not a URL param.
  - Backend route: `POST /api/commands` → [[command.routes]] → [[command.controller]] `executeCommand` → [[command.service]] `execute`.
  - `transformResponse`: unwraps `response.data`, throws `'No data returned'` if missing.
  - `invalidatesTags: (_r, _e, { documentId }) => [{ type: 'AIArtifact', id: documentId }]`.
- Exported hook: `useExecuteCommandMutation`.

## Source
`client/src/api/commandApi.ts`

## Dependencies
- Imports: [[baseApi]], `ApiResponse`/`AIArtifactDTO` types from `@/types`.
- Used by: [[MetadataPanel]] (the three AI action buttons).
- Backend: [[command.routes]] → [[command.controller]] → [[command.service]].

## Related
- [[MetadataPanel]]
- [[command.routes]]
- [[command.controller]]
- [[API-Contract]]

## Notes
`regenerate` is part of the type but [[MetadataPanel]] never passes it, so every UI-triggered command is cache-first (server checks `ai_artifacts` before calling Gemini) — see [[command.service]].
