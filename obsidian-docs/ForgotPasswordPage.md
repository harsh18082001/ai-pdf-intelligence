---
tags: [frontend, page, auth]
---
## Purpose
Request a password-reset email. Route: `/forgot-password`.

## Key Details
- Submits `useForgotPasswordMutation({ email })`; on success (always, per the backend's no-leak design — see [[auth.service]]) shows a static "if an account exists, a link is on its way" message instead of the form, rather than navigating away — so the user isn't left wondering whether it worked.

## Source
`client/src/pages/auth/ForgotPasswordPage.tsx`

## Dependencies
- Imports: [[authApi]] (`useForgotPasswordMutation`), [[AuthLayout]], [[FormField]].
- Rendered by: `App.tsx` route `/forgot-password`.

## Related
- [[ResetPasswordPage]]
- [[LoginPage]]
- [[auth.service]]

## Notes
Deliberately never shows an error for "email not found" — matches the backend's account-existence-leak prevention. Only a genuine network/server error would toast here.
