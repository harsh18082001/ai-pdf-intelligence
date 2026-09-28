---
tags: [frontend, page, auth]
---
## Purpose
Set a new password from a reset-email link. Route: `/reset-password?token=...`.

## Key Details
- Reads `token` from `useSearchParams()`; if missing, renders an [[EmptyState]] ("Invalid reset link") with a link back to `/forgot-password` instead of a form — the page has two genuinely different render paths, not a form that silently fails.
- With a token present: single password field → `useResetPasswordMutation({ token, password })` → toast + `navigate('/login')` (deliberately does **not** auto-login — matches the backend revoking all sessions on password reset, see [[auth.service]]).

## Source
`client/src/pages/auth/ResetPasswordPage.tsx`

## Dependencies
- Imports: [[authApi]] (`useResetPasswordMutation`), [[AuthLayout]], [[FormField]], [[EmptyState]].
- Rendered by: `App.tsx` route `/reset-password`.

## Related
- [[ForgotPasswordPage]]
- [[VerifyEmailPage]]
- [[auth.service]]

## Notes
If you're tempted to auto-login after a successful reset, don't — the server-side `resetPassword` intentionally revokes every session (including any session the reset flow itself might have implied), so an auto-login would need a *new* login call anyway, at which point sending the user to `/login` explicitly is simpler and matches user expectations after a password reset.
