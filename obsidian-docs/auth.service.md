---
tags: [backend, service, auth]
---
## Purpose
All auth business logic: register/login/refresh/logout, email verification, password reset, and the guest→account document migration.

## Key Details
- `class AuthService`, singleton export `authService`.
- `private issueTokens(user, meta)` — signs an access JWT, creates a `Session` row with a placeholder `refreshTokenHash`, signs the refresh JWT (embeds the session id so `refresh()` can look it up directly), then overwrites the row's hash with `sha256(refreshToken)` via `sessionRepository.setRefreshHash`. Two-step because the refresh JWT needs the session's id, which only exists after the row is created.
- `register(input, meta)` — checks email uniqueness (`409` if taken), Argon2id-hashes the password, creates the `User`, migrates guest documents (`meta.guestSessionId`), sends a verification email, issues tokens.
- `login(input, meta)` — Argon2 `verify`; on failure, increments `failedLoginAttempts` and sets `lockedUntil` (15 min) once `attempts >= 5`; on success, resets the counter, migrates guest documents, issues tokens. `423` if currently locked.
- `refresh(refreshToken, meta)` — verifies the JWT, looks up the `Session` by `sha256(refreshToken)`, checks it matches the JWT's `sid`. If the session is **already revoked**, treats this as token reuse (a stolen/replayed refresh token) — revokes **every** session for that user and rejects. Otherwise issues fresh tokens and revokes the old session (rotation).
- `logout(refreshToken)` / `logoutAll(userId)` — revoke one session / every session for a user.
- `sendVerificationEmail` (private) / `resendVerification(email)` / `verifyEmail(token)` — token is a random 32-byte hex value; only its SHA-256 hash is stored (`VerificationToken.tokenHash`), same pattern as refresh tokens, so a DB dump alone doesn't yield usable tokens.
- `forgotPassword(email)` / `resetPassword(token, newPassword)` — same hashed-token pattern; `resetPassword` also calls `sessionRepository.revokeAllForUser` (a password change logs out every device, including the one that changed it — it must log in again).
- Both `resendVerification` and `forgotPassword` return successfully (and send nothing) if the email doesn't exist, rather than erroring — avoids leaking which emails have accounts.

## Source
`server/src/services/auth.service.ts`

## Dependencies
- Imports: `argon2`, [[user.repository|repositories/user.repository.ts]], [[session.repository|repositories/session.repository.ts]], [[verification-token.repository|repositories/verification-token.repository.ts]], [[document.repository]] (`migrateGuestDocuments`), [[email.service]], `signAccessToken`/`signRefreshToken`/`verifyRefreshToken` from `utils/jwt.ts`, `sha256`/`randomToken` from `utils/crypto.ts`, `AppError`.
- Called by: [[auth.controller]] (every handler except `csrfToken`).

## Related
- [[auth.controller]]
- [[auth.routes]]
- [[Model-User]]
- [[Model-Session]]
- [[Model-VerificationToken]]
- [[document.repository]]
- [[email.service]]
- [[Auth-System]]

## Notes
The lockout counter (`failedLoginAttempts`/`lockedUntil` on `User`) is per-account, not per-IP — contrast with `authLimiter` ([[rate-limiter]]), which is per-IP. Both exist simultaneously and address different attack shapes (one attacker hammering one account from many IPs vs. one IP hammering many accounts). Refresh-token reuse detection revokes **all** sessions for the user, not just the reused one — this is deliberate (can't tell which of the two holders, if any, is legitimate) and means a real user who's genuinely just using two tabs/devices with a race condition on refresh could get logged out everywhere; this is an accepted false-positive cost of the security property.
