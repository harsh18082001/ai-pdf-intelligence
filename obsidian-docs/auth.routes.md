---
tags: [backend, routes, auth]
---
## Purpose
Mounts every `/api/auth/*` endpoint with its validation/rate-limit/auth-guard middleware.

## Key Details
See [[API-Contract]] for the full endpoint-by-endpoint reference. Middleware pattern per route:
- `authLimiter` ([[rate-limiter]]) on every credential-touching route: `register`, `login`, `resend-verification`, `forgot-password`, `reset-password`.
- `validate(schema)` ([[validation]]) on every route with a body: the matching Zod schema for each.
- `requireUser` ([[auth.middleware]]) on `logout-all` and `me` — the only two routes a guest can't hit.
- `csrf-token`, `refresh`, `logout`, `verify-email` have no `authLimiter` — refresh/logout are token-gated already (a stolen/guessed refresh cookie is the actual risk, not brute-forcing this endpoint), and `verify-email` tokens are already unguessable 32-byte random values.

## Source
`server/src/routes/auth.routes.ts`

## Dependencies
- Imports: [[auth.controller]] (every handler), `authLimiter` ([[rate-limiter]]), `requireUser` ([[auth.middleware]]), validation schemas ([[validation]]).
- Mounted by: [[routes-index|routes/index.ts]] at `/auth`.

## Related
- [[auth.controller]]
- [[API-Contract]]
- [[Auth-System]]

## Notes
If you add a new auth endpoint that touches a password or sends an email, default to adding `authLimiter` — the existing pattern treats "anything that could be brute-forced or used to spam a mailbox" as needing it, not just login itself.
