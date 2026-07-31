---
tags: [frontend, dead-code]
---
## Purpose
Instantiates a Supabase JS client. **Not imported anywhere else in the codebase.**

## Key Details
- `export const supabase = createClient(supabaseUrl, supabaseAnonKey)`
- `supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''`, `supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''`.
- If the env vars are unset, this still constructs a client with empty strings (no runtime error at import time) — but any actual call against it would fail.

## Source
`client/src/lib/supabase.ts`

## Dependencies
- Imports: `@supabase/supabase-js`.
- Used by: **nobody** — confirmed via repo-wide search, no other file imports `@/lib/supabase`.

## Related
- [[AuthContext]]
- [[Known-Issues-and-Conventions#Supabase client is installed but unused]]

## Notes
The project depends on `@supabase/supabase-js` and defines `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`-shaped config here, which could read as "auth is Supabase-backed" — it is not. The real identity mechanism is the anonymous `clientId` in [[AuthContext]]. Don't wire new features against this client assuming an active Supabase session exists; there isn't one. Supabase's only confirmed real use in this project is hosting the Postgres database itself (via `DATABASE_URL` on the server), not client-side auth.
