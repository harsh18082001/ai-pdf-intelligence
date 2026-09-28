---
tags: [frontend, api]
---
## Purpose
The single RTK Query `createApi` instance every other API slice injects endpoints into. Owns the base URL, credentials, CSRF header, auth-token injection, and a 401-triggered refresh-and-retry wrapper.

## Key Details
- `export const baseApi = createApi({ reducerPath: 'api', baseQuery: baseQueryWithReauth, tagTypes: [..., 'User'], endpoints: () => ({}) })`.
- `rawBaseQuery = fetchBaseQuery({ baseUrl, credentials: 'include', prepareHeaders })` — `credentials: 'include'` is required now so the httpOnly guest/refresh/CSRF cookies are actually sent cross-origin (client and server are separate Vercel deployments).
- `prepareHeaders`: sets `Authorization: Bearer <accessToken>` from `getAccessToken()` (`client/src/lib/token-store.ts` — **in-memory only, never localStorage**) and `x-csrf-token` read straight off the non-httpOnly `dociq_csrf` cookie via `document.cookie` regex — see [[csrf.middleware]].
- `baseQueryWithReauth` (the actual `baseQuery` passed to `createApi`): wraps `rawBaseQuery`; on a `401` response for any URL that isn't itself under `/auth/`, it calls `/auth/refresh` once (de-duped via a module-scope `refreshPromise` so concurrent 401s don't fire multiple refreshes), and on success retries the original request with the new access token. This is what makes a short-lived (~15 min) access token invisible to the rest of the app — nothing else needs to know it expired.
- **No more `dociq_client_id` anywhere in this file** — the old `prepareHeaders` that read it from `localStorage` and set `x-client-id` is gone entirely.
- Defines no endpoints itself — [[chatApi]], [[commandApi]], [[documentApi]], [[authApi]] all call `baseApi.injectEndpoints(...)`.

## Source
`client/src/api/baseApi.ts`

## Dependencies
- Imports: `createApi`, `fetchBaseQuery` from `@reduxjs/toolkit/query/react`, `getAccessToken`/`setAccessToken` from `client/src/lib/token-store.ts`.
- Used by: [[chatApi]], [[commandApi]], [[documentApi]], [[authApi]] (inject endpoints), [[store]] (registers `baseApi.reducer` + `baseApi.middleware`).

## Related
- [[chatApi]]
- [[commandApi]]
- [[documentApi]]
- [[authApi]]
- [[store]]
- [[AuthContext]]
- [[csrf.middleware]]
- [[ENV-Variables]]

## Notes
`VITE_API_URL` still has no `client/.env.example` documenting it (see [[ENV-Variables]]) — unchanged. If you add a new way of calling the API that doesn't go through this file's `baseQuery` (a raw `fetch`, a new `EventSource`-style call like [[useChat]]'s stream URL), you're responsible for adding `credentials: 'include'` and the `x-csrf-token` header yourself on any mutating request, or the server's [[csrf.middleware]] will 403 it.
