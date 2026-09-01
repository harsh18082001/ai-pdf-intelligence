---
tags: [frontend, component, auth]
---
## Purpose
Shared chrome for every auth page: centered card, brand mark link home, title/description, optional footer link.

## Key Details
- `AuthLayout({ title, description, children, footer? })` — brand mark + "DocIQ" wordmark linking to `/`, a [[Card]]-based form container (`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`), and an optional centered footer line below the card (used for "Don't have an account? Sign up" style links).
- `FormField` (`client/src/components/auth/FormField.tsx`, separate file, same directory) — a labeled `Input` wrapper taking `label`/`type`/`value`/`onChange`/`autoComplete`/`required`, with an optional `children` slot for a hint or secondary link rendered below the input (used for "Forgot password?" and password-hint text).

## Source
`client/src/components/auth/AuthLayout.tsx`, `client/src/components/auth/FormField.tsx`

## Dependencies
- Imports: `react-router-dom`'s `Link`, `lucide-react`'s `FileText`, `Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`, `Input`.
- Used by: [[LoginPage]], [[SignupPage]], [[ForgotPasswordPage]], [[ResetPasswordPage]], [[VerifyEmailPage]] (all five auth pages).

## Related
- [[LoginPage]]
- [[SignupPage]]
- [[ForgotPasswordPage]]
- [[ResetPasswordPage]]
- [[VerifyEmailPage]]

## Notes
Both files live in `client/src/components/auth/`, which existed as an **empty** directory before this pass (per the pre-auth-overhaul vault notes) — it was scaffolded but never used until now.
