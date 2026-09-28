---
tags: [frontend, page, auth]
---
## Purpose
Registration form. Route: `/signup`.

## Key Details
- Local `name`/`email`/`password` state → `useRegisterMutation()` ([[authApi]]) → `setUser(user)` → toast ("check your inbox to verify") → `navigate('/')`.
- Password field shows a static hint ("at least 10 characters, uppercase, lowercase, and a number") matching the server's `passwordSchema` ([[validation]]) — a UI-side mirror of a server-side rule, not enforced client-side beyond `required`; the actual validation happens server-side and surfaces as a toast on failure.

## Source
`client/src/pages/auth/SignupPage.tsx`

## Dependencies
- Imports: [[authApi]] (`useRegisterMutation`), [[AuthContext]], [[AuthLayout]], [[FormField]].
- Rendered by: `App.tsx` route `/signup`.

## Related
- [[LoginPage]]
- [[AuthContext]]
- [[authApi]]
- [[auth.service]]
- [[Auth-System]]

## Notes
If the server's password rules ever change, update the hint text here too — it's a plain string, not derived from the shared schema (there's no shared validation-schema package between client/server in this repo).
