---
tags: [frontend, page, auth]
---
## Purpose
Email/password login form. Route: `/login`.

## Key Details
- Local `email`/`password` state → `useLoginMutation()` ([[authApi]]) on submit → `setUser(user)` ([[AuthContext]]) → toast + `navigate('/')`.
- Wrapped in [[AuthLayout]]; fields via the shared [[FormField]] component. Links to `/signup` and `/forgot-password`.
- Copy explicitly mentions guest documents merging automatically on login — reinforcing the guest→account migration ([[auth.service]]) is invisible/automatic, not a step the user has to do.

## Source
`client/src/pages/auth/LoginPage.tsx`

## Dependencies
- Imports: [[authApi]] (`useLoginMutation`), [[AuthContext]] (`useAuth` for `setUser`), [[AuthLayout]], [[FormField]].
- Rendered by: `App.tsx` route `/login`.

## Related
- [[SignupPage]]
- [[AuthContext]]
- [[authApi]]
- [[Auth-System]]

## Notes
Error handling is a generic toast (`error?.data?.error || 'Invalid email or password'`) — deliberately doesn't distinguish "wrong password" from "account doesn't exist" in the UI (the backend already doesn't leak that distinction for `forgot-password`/`resend-verification`; login itself returns a generic `401` either way).
