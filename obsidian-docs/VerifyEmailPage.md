---
tags: [frontend, page, auth]
---
## Purpose
Lands here from the verification email's link; confirms the token server-side. Route: `/verify-email?token=...`.

## Key Details
- Three-state UI (`verifying` | `success` | `error`), driven by a `useEffect` (guarded with a `useRef` so it only fires once even under React 19 Strict Mode's double-invoke) that calls `useVerifyEmailMutation()` with the `token` query param.
- No `token` present → immediately `error` state, no network call.

## Source
`client/src/pages/auth/VerifyEmailPage.tsx`

## Dependencies
- Imports: [[authApi]] (`useVerifyEmailMutation`), [[AuthLayout]].
- Rendered by: `App.tsx` route `/verify-email`.

## Related
- [[ResetPasswordPage]]
- [[auth.service]]

## Notes
The `ran` ref guard exists specifically because Strict Mode mounts effects twice in dev — without it, a verification token (single-use, per [[Model-VerificationToken]]) would get consumed by the first call and the second would show an "invalid/expired" error even though verification actually succeeded. If you see this pattern elsewhere and are tempted to remove it as "unnecessary," check whether the underlying call is single-use first.
