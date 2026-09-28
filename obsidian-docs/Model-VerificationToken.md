---
tags: [backend, model]
---
## Purpose
Prisma model shared by both email-verification and password-reset tokens (distinguished by `type`).

## Key Details
```prisma
enum VerificationTokenType {
  EMAIL_VERIFY
  PASSWORD_RESET
}

model VerificationToken {
  id        String                @id @default(cuid())
  userId    String
  tokenHash String                @unique
  type      VerificationTokenType
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime              @default(now())

  user      User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```
- `tokenHash` — same pattern as `Session.refreshTokenHash`: `sha256(rawToken)`, raw token never persisted, only ever emailed to the user.
- `findValidByHash(tokenHash, type)` ([[verification-token.repository|repositories/verification-token.repository.ts]]) filters `usedAt: null, expiresAt: { gt: now }` — a used or expired token is invisible to lookups, not just "flagged."
- `invalidateAllForUser(userId, type)` — marks every un-used token of that type as used, called before issuing a new one (`resendVerification`, `forgotPassword`) so old links stop working once a new one is requested.
- Email-verify tokens expire in 24h, password-reset in 1h (set at creation time in [[auth.service]], not a schema-level constant).

## Source
`server/prisma/schema.prisma` (VerificationToken model + enum)

## Dependencies
- Read/written by: [[verification-token.repository|repositories/verification-token.repository.ts]].
- Referenced (FK) by: none (leaf model, other than its own `User` FK).

## Related
- [[Model-User]]
- [[auth.service]]
- [[email.service]]
- [[Auth-System]]

## Notes
One model handling two token *kinds* via a `type` discriminant (rather than two separate tables) was a deliberate simplification — if a third kind is ever needed (e.g. an email-change confirmation), extend the enum rather than adding a new table, unless it needs meaningfully different fields.
