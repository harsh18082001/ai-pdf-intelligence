---
tags: [architecture, auth]
---
## Purpose
Hub note for the whole enterprise-auth-and-guest-mode overhaul — start here for "how does identity/auth work now," then drill into the individual files linked below.

## Key Details

### Identity model
Every request has exactly one owner, `RequestOwner` (`server/src/types/index.ts`):
```ts
type RequestOwner =
  | { type: 'user'; id: string; email: string; name: string | null; role: string }
  | { type: 'guest'; id: string };
```
Set once per request, in `app.ts`, by two middlewares run in order:
1. [[guest-session.middleware]] — always runs first, always sets `req.owner` to at least a guest. Issues a random id, HMAC-signs it with `GUEST_SESSION_SECRET`, stores it as an httpOnly `dociq_guest_id` cookie. The browser can carry this cookie around forever but can't read or forge its value.
2. [[auth.middleware]] — if `Authorization: Bearer <accessToken>` is present and the JWT verifies, **overwrites** `req.owner` with the authenticated user. If not, the guest owner from step 1 stands.

### Guests are first-class, not a fallback
Guests get real DB rows (`Document.guestSessionId`), real "recent documents," real chat/command history — everything a logged-in user gets, scoped by the guest cookie instead of a `userId`. This is what "usable without an account" actually means here: nothing degrades to client-only storage for guests.

### Users: password auth, JWT + rotating refresh tokens
- Passwords: Argon2id (`argon2` package), never anything weaker.
- Access token: short-lived JWT (`ACCESS_TOKEN_TTL_MIN`, default 15 min), signed with `JWT_ACCESS_SECRET`, held **in memory only** on the client (`client/src/lib/token-store.ts` — a module-scope variable, never `localStorage`/`sessionStorage`). Sent as `Authorization: Bearer ...`.
- Refresh token: longer-lived JWT (`REFRESH_TOKEN_TTL_DAYS`, default 30 days), signed with a *different* secret (`JWT_REFRESH_SECRET`), delivered as an httpOnly cookie. Its **hash** (SHA-256, not the raw token) is stored in the `Session` table ([[Model-Session]]) so a DB leak alone can't be replayed as a valid refresh token.
- Rotation + reuse detection: every `/auth/refresh` call issues a brand-new refresh token and immediately revokes the old `Session` row. If a *revoked* session's hash is ever presented again (meaning a refresh token got stolen and both the attacker and the legitimate user tried to use it), every session for that user is revoked and the request is rejected — see [[auth.service]]`.refresh()`.
- [[baseApi]] wraps every request: on a `401`, it calls `/auth/refresh` once (de-duped across concurrent requests) and retries — so the rest of the frontend never has to think about token expiry.

### Guest → account merge (the "guest changes are saved" requirement)
[[auth.service]]`.register()`/`.login()` both call `documentRepository.migrateGuestDocuments(guestSessionId, userId)` using the *current request's* guest cookie, automatically, with no separate UI step or endpoint the frontend has to remember to call. A guest who uploads 3 documents then signs up simply finds those 3 documents in their account afterward.

### CSRF
Cookies do the authenticating (guest id, refresh token), so a classic CSRF risk exists for any state-changing request. [[csrf.middleware]] mitigates it with the double-submit pattern: a non-httpOnly `dociq_csrf` cookie, echoed back in an `x-csrf-token` header on every mutation. [[baseApi]] does this automatically for RTK Query calls.

### Email
[[email.service]] wraps Gmail SMTP (via `nodemailer`) for verification/password-reset emails — switched from Resend since Resend requires a verified custom domain to send to arbitrary recipients. If `GMAIL_USER`/`GMAIL_APP_PASSWORD` are unset, it logs the email instead of sending — safe default for local dev, no silent failure.

### Original file storage
[[b2-storage.service]] persists the original uploaded PDF to Backblaze B2 (S3-compatible API via `@aws-sdk/client-s3`) so a document survives independent of any one browser's IndexedDB cache and can follow a guest→account migration. `GET /api/documents/:id/file` returns a short-lived presigned URL — not yet wired into [[PDFViewer]] (still IndexedDB-first), see [[Known-Issues-and-Conventions]].

## Source
`server/src/services/auth.service.ts`, `server/src/middlewares/{guest-session,auth,csrf}.middleware.ts`, `server/src/repositories/{user,session,verification-token}.repository.ts`, `server/prisma/schema.prisma` (`User`/`Session`/`VerificationToken`), `client/src/context/AuthContext.tsx`, `client/src/api/{baseApi,authApi}.ts`, `client/src/lib/token-store.ts`.

## Dependencies
Touches nearly every backend controller/service (all now take `RequestOwner` instead of a bare `clientId`) — see [[Known-Issues-and-Conventions]] for the before/after.

## Related
- [[AuthContext]]
- [[authApi]]
- [[baseApi]]
- [[guest-session.middleware]]
- [[auth.middleware]]
- [[csrf.middleware]]
- [[auth.service]]
- [[auth.controller]]
- [[auth.routes]]
- [[email.service]]
- [[b2-storage.service]]
- [[Model-User]]
- [[Model-Session]]
- [[Model-VerificationToken]]
- [[Model-Document]]
- [[Data-Flow#4. Auth / identity flow]]
- [[API-Contract]]
- [[ENV-Variables]]

## Notes
This replaced a fully client-trusted `clientId` scheme (see [[Known-Issues-and-Conventions]] for the "what used to be true" history) — nothing from that scheme survives except the *concept* of "identity travels with every request." If asked to add another OAuth provider, email/password is the only method implemented today (deliberately, per product decision) — there's no Google/GitHub wiring, though a prior (reverted) attempt at Google OAuth exists in git history at commit `7a66ac6` if that's ever revisited.
