---
tags: [backend, middleware, auth]
---
## Purpose
Double-submit-cookie CSRF protection for every state-changing request, now that cookies (guest id, refresh token) carry real authentication weight.

## Key Details
- `csrfMiddleware(req, res, next)`: reads the `dociq_csrf` cookie; if absent, mints one (`randomToken(16)`) and sets it via `setCsrfCookie` — **not** `httpOnly`, specifically so client JS can read it (`document.cookie`) and echo it back.
- For `GET`/`HEAD`/`OPTIONS` ("safe" methods), that's all it does — issue-if-missing, then `next()`.
- For every other method, it requires the `x-csrf-token` request header to exactly match the cookie value (`timingSafeEqualHex`); mismatch or missing header → `403 AppError('Invalid or missing CSRF token')`.
- Also sets `req.csrfToken` so `GET /api/auth/csrf-token` ([[auth.controller]]`.csrfToken`) can hand it back explicitly if a caller wants to fetch it without triggering a mutation first.

## Source
`server/src/middlewares/csrf.middleware.ts`

## Dependencies
- Imports: `randomToken`/`timingSafeEqualHex` from `utils/crypto.ts`, `setCsrfCookie`/`CSRF_COOKIE`/`getCookie` from `utils/cookies.ts`, `AppError`.
- Used by: `app.ts` (mounted globally, after [[auth.middleware]], before the API routes).
- Read by: [[baseApi]] (client side — parses `document.cookie` for `dociq_csrf`, sets `x-csrf-token`).

## Related
- [[baseApi]]
- [[Auth-System]]
- [[Known-Issues-and-Conventions#CSRF: every mutating request needs the `x-csrf-token` header]]

## Notes
Any new client-side call that mutates state and bypasses [[baseApi]] (a raw `fetch`, a new endpoint) must read the `dociq_csrf` cookie and set the header itself, or it will 403. [[useChat]]'s streaming call is exempt because it's a `GET` (safe method) — don't assume streaming endpoints are generally exempt if one is ever changed to `POST`.
