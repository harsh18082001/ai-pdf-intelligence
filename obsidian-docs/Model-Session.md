---
tags: [backend, model]
---
## Purpose
Prisma model for one refresh-token "session" — the persisted half of the access/refresh token pair, enabling revocation and reuse detection.

## Key Details
```prisma
model Session {
  id                   String    @id @default(cuid())
  userId               String
  refreshTokenHash     String    @unique
  userAgent            String?
  ip                   String?
  revokedAt            DateTime?
  replacedBySessionId  String?
  expiresAt            DateTime
  createdAt            DateTime  @default(now())

  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```
- `refreshTokenHash` — `sha256(rawRefreshToken)`, unique. The raw token itself is never stored — only [[auth.service]]`.refresh()`/`.logout()` ever compute this hash (from a token presented by the client) to look a row up.
- One row per issued refresh token, not per "login session" in the everyday sense — every `/auth/refresh` call creates a **new** row (rotation) and marks the old one `revokedAt` (see `replacedBySessionId`, currently set but not actively read anywhere — a hook for building a session-history UI later).
- `revokedAt` non-null + the hash being presented again = reuse detected → [[auth.service]] revokes every session for `userId`.
- No cleanup job for expired/revoked rows — they accumulate. Not a correctness issue (revoked/expired sessions are already rejected by application logic), but worth knowing if this table's row count ever becomes a concern.

## Source
`server/prisma/schema.prisma` (Session model)

## Dependencies
- Read/written by: [[session.repository|repositories/session.repository.ts]].
- Referenced (FK) by: none (leaf model, other than its own `User` FK).

## Related
- [[Model-User]]
- [[auth.service]]
- [[Auth-System]]

## Notes
If you add a "log out all other devices" or "active sessions" UI, this table already has everything needed (`userAgent`/`ip`/`createdAt`/`revokedAt`) — just needs a listing endpoint and a per-session revoke (vs. today's only-revoke-all via `/auth/logout-all`).
