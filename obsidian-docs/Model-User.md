---
tags: [backend, model]
---
## Purpose
Prisma model for a registered account.

## Key Details
```prisma
model User {
  id                  String    @id @default(cuid())
  email               String    @unique
  passwordHash        String
  name                String?
  role                String    @default("user") // user, admin
  emailVerifiedAt     DateTime?
  failedLoginAttempts Int       @default(0)
  lockedUntil         DateTime?
  lastLoginAt         DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  sessions             Session[]
  verificationTokens   VerificationToken[]
  documents            Document[]
}
```
- `id` is a `cuid()`, not an autoincrement int (unlike every other model in this schema) — matches the string-id convention JWTs (`sub` claim) expect.
- `passwordHash` — Argon2id, never anything else. No raw password is ever persisted or logged.
- `role` — free-form string (`"user"`/`"admin"`), not an enum; nothing in the app currently branches on `role` besides carrying it through the JWT payload — no admin-only routes exist yet.
- `failedLoginAttempts`/`lockedUntil` — account-level lockout state, set by [[auth.service]]`.login()`.
- `emailVerifiedAt` — `null` until [[auth.service]]`.verifyEmail()` runs; nothing currently *gates* on this being set (a user can use the app fully unverified) — it's tracked but not yet enforced anywhere.

## Source
`server/prisma/schema.prisma` (User model)

## Dependencies
- Read/written by: [[user.repository|repositories/user.repository.ts]].
- Referenced (FK) by: [[Model-Session]], [[Model-VerificationToken]], [[Model-Document]] (`userId`).

## Related
- [[auth.service]]
- [[Model-Session]]
- [[Model-VerificationToken]]
- [[Model-Document]]
- [[Auth-System]]

## Notes
If you're asked to add an "admin" capability, `role` already has the field — you'd need to add the actual authorization check (e.g. a `requireRole('admin')` middleware alongside [[auth.middleware]]'s `requireUser`), since none exists today.
