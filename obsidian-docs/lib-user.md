---
tags: [frontend, dead-code]
---
## Purpose
Alternate anonymous-ID generator/persister. **Not imported anywhere else in the codebase** — superseded by [[AuthContext]]'s `getStoredClientId`.

## Key Details
- `getOrCreateUserId(): string` — reads/writes `localStorage['dociq_user_id']` (note: different key than `AuthContext`'s `dociq_client_id`). Falls back to `Date.now()+Math.random()`-based ID if `crypto.randomUUID` is unavailable; returns `'server_environment'` if `window` is undefined (SSR guard, unused since this is a pure Vite SPA).

## Source
`client/src/lib/user.ts`

## Dependencies
- Used by: **nobody**.

## Related
- [[AuthContext]]
- [[Known-Issues-and-Conventions#Supabase client is installed but unused]]

## Notes
Duplicate/earlier implementation of the same idea as `AuthContext.getStoredClientId()`, under a different localStorage key (`dociq_user_id` vs `dociq_client_id`). Do not import this thinking it's the active identity mechanism — `AuthContext.ts`'s `dociq_client_id` is what the API layer and backend actually key off of.
