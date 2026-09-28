---
tags: [backend, controller, auth]
---
## Purpose
HTTP handlers for every `/api/auth/*` route — thin, delegates all logic to [[auth.service]]; owns cookie-setting.

## Key Details
- `meta(req)` (private helper) — `{ userAgent, ip, guestSessionId: req.guestId }`, passed to `authService.register`/`.login` so they can migrate guest documents and record session metadata.
- `applySession(res, tokens)` (private helper) — the one place `setRefreshCookie` is called, from every handler that issues new tokens (`register`, `login`, `refresh`).
- `register`/`login` — call the matching `authService` method, `applySession`, respond with `{ user, accessToken }` (the access token goes in the JSON body, not a cookie — the client keeps it in memory, see [[baseApi]]).
- `refresh` — reads the refresh cookie via `getCookie(req, REFRESH_COOKIE)`, `401`s if absent, else delegates and re-applies the rotated session.
- `logout` — reads the refresh cookie (if any), revokes it, `clearRefreshCookie` unconditionally (idempotent even with no active session).
- `logoutAll`/`me` — require `req.owner.type === 'user'` (double-checked here even though [[auth.routes]] already applies `requireUser` — belt-and-suspenders since `req.owner` is `RequestOwner | undefined` at the type level).
- `verifyEmail`/`resendVerification`/`forgotPassword`/`resetPassword` — straight passthroughs to [[auth.service]], generic success messages (see that file's Notes on not leaking account existence).
- `csrfToken` — returns `req.csrfToken` (set by [[csrf.middleware]]) as JSON, for a caller that wants the token without triggering a mutation first.

## Source
`server/src/controllers/auth.controller.ts`

## Dependencies
- Imports: [[auth.service]], `AppError`, `REFRESH_COOKIE`/`setRefreshCookie`/`clearRefreshCookie`/`getCookie` from `utils/cookies.ts`, `env`, `ApiResponse`/`UserDTO` types.
- Called by: [[auth.routes]].

## Related
- [[auth.routes]]
- [[auth.service]]
- [[authApi]]
- [[Auth-System]]

## Notes
The access token is deliberately **not** put in a cookie at all — only the refresh token is. This keeps the access token out of any cookie-based attack surface (CSRF doesn't apply to it, since it's not auto-sent) at the cost of the client having to hold it in memory and re-fetch it via `/auth/refresh` on every fresh page load.
