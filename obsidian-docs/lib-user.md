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
Was already dead code before the auth overhaul (a duplicate/earlier implementation of the same idea as the old `AuthContext.getStoredClientId()`), and remains dead code after it — [[AuthContext]] no longer generates any client-side identity string at all (real identity is now server-issued, see [[Auth-System]]), so this file has even less claim to relevance than before. Do not import this thinking it's part of the active identity mechanism.
