---
tags: [backend, middleware, auth]
---
## Purpose
Runs second (after [[guest-session.middleware]]); upgrades `req.owner` to an authenticated user if a valid access token is present.

## Key Details
- `authMiddleware(req, res, next)`: if `Authorization: Bearer <token>` is present, `verifyAccessToken(token)` (JWT verify against `JWT_ACCESS_SECRET`); on success, replaces `req.owner` with `{ type: 'user', id: payload.sub, email, name, role }`. On any failure (missing header, invalid/expired token), does nothing — the guest owner set by the previous middleware stands, request proceeds either way (this middleware never rejects a request itself).
- `requireUser(req, res, next)` (separate export) — the actual gate: `403`/`401`s if `req.owner?.type !== 'user'`. Used on routes that must not be reachable by a guest (`/auth/logout-all`, `/auth/me`).

## Source
`server/src/middlewares/auth.middleware.ts`

## Dependencies
- Imports: `verifyAccessToken` from `utils/jwt.ts`.
- Used by: `app.ts` (`authMiddleware`, globally, after guest-session), [[auth.routes]] (`requireUser` on `/logout-all` and `/me`).

## Related
- [[guest-session.middleware]]
- [[auth.service]]
- [[Auth-System]]

## Notes
This file is a full rewrite of a same-named file from a prior (reverted) attempt that verified **Google** ID tokens via `google-auth-library` — this version verifies the app's own JWTs instead, since the product decision was email/password only, no OAuth. Don't reintroduce the Google-specific logic without a new decision to add OAuth back.
