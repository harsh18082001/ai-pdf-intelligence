---
tags: [backend, middleware, auth]
---
## Purpose
Runs first in the middleware chain (`app.ts`); guarantees every request has an identity, even with no login — a signed, server-issued guest session.

## Key Details
- `guestSessionMiddleware(req, res, next)`: reads the `dociq_guest_id` cookie. If present and its signature verifies (`isValidSignedGuestId`), sets `req.guestId`/`req.owner = { type: 'guest', id }` from it. Otherwise mints a new random id (`randomToken(16)`), HMAC-signs it (`hmacSign(id, GUEST_SESSION_SECRET)`), stores `"${id}.${sig}"` as the cookie value via `setGuestCookie`, and sets `req.owner` from the fresh id.
- `isValidSignedGuestId(value)`: splits on `.`, recomputes the HMAC, compares with `timingSafeEqualHex` (constant-time — avoids a timing side-channel on the comparison).
- Cookie itself (`setGuestCookie`, `utils/cookies.ts`): `httpOnly`, `secure` in prod, `sameSite: 'none'` in prod / `'lax'` in dev, ~5-year `maxAge`.

## Source
`server/src/middlewares/guest-session.middleware.ts`

## Dependencies
- Imports: `randomToken`/`hmacSign`/`timingSafeEqualHex` from `utils/crypto.ts`, `setGuestCookie`/`getCookie`/`GUEST_COOKIE` from `utils/cookies.ts`, `env`.
- Used by: `app.ts` (mounted globally, before [[auth.middleware]]).
- Sets: `req.guestId`, `req.owner` (may be overwritten by [[auth.middleware]] for a logged-in user).

## Related
- [[auth.middleware]]
- [[Auth-System]]
- [[auth.service]] (`migrateGuestData` reads `req.guestId` via `meta(req).guestSessionId` in [[auth.controller]])
- [[Known-Issues-and-Conventions#Auth is now real: email/password + server-issued guest sessions]]

## Notes
The browser cannot forge or read a usable guest id — it only ever sees an opaque `id.signature` string it must send back verbatim. This is the load-bearing fix over the old model, where the browser generated its own `clientId` and the server simply trusted whatever string arrived. If the signature check fails (tampered cookie, secret rotated), this middleware silently issues a **new** guest id rather than erroring — meaning a `GUEST_SESSION_SECRET` rotation effectively logs out every guest (their old documents become orphaned under an id they can no longer present), which is an accepted tradeoff, not a bug.
