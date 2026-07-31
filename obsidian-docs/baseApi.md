---
tags: [frontend, api]
---
## Purpose
The single RTK Query `createApi` instance every other API slice injects endpoints into. Owns the base URL, auth header, and cache tag types.

## Key Details
- `export const baseApi = createApi({ reducerPath: 'api', baseQuery: fetchBaseQuery({...}), tagTypes: ['Document', 'Message', 'AIArtifact'], endpoints: () => ({}) })`
- `baseUrl: import.meta.env.VITE_API_URL || '/api'`
- `prepareHeaders`: reads `localStorage.getItem('dociq_client_id')` and sets it as the `x-client-id` header on every request (if present). This is the entire client-identity mechanism — see [[AuthContext]].
- Defines no endpoints itself — [[chatApi]], [[commandApi]], [[documentApi]] all call `baseApi.injectEndpoints(...)`.

## Source
`client/src/api/baseApi.ts`

## Dependencies
- Imports: `createApi`, `fetchBaseQuery` from `@reduxjs/toolkit/query/react`.
- Used by: [[chatApi]], [[commandApi]], [[documentApi]] (inject endpoints), [[store]] (registers `baseApi.reducer` + `baseApi.middleware`).

## Related
- [[chatApi]]
- [[commandApi]]
- [[documentApi]]
- [[store]]
- [[AuthContext]]
- [[ENV-Variables]]

## Notes
`VITE_API_URL` has no `client/.env.example` documenting it (see [[ENV-Variables]]) — it defaults to same-origin `/api`, which only works if client and server are served from the same host (e.g. behind a single Vercel deployment/proxy). In local dev with separate ports you must set it explicitly.
