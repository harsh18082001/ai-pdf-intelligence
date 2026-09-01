---
tags: [frontend, api, auth]
---
## Purpose
RTK Query slice for every `/api/auth/*` call. The one API slice that also reaches outside RTK Query's own state to update the in-memory access token.

## Key Details
- `register`/`login` mutations — `transformResponse` calls `setAccessToken(response.data.accessToken)` ([[token-store|lib/token-store.ts]]) as a side effect of transforming the response, then returns just the `UserDTO` half to the caller. This is the only place outside [[baseApi]]'s reauth wrapper that writes the token store.
- `refresh` mutation — same pattern, but returns `UserDTO | null` (null if there was no session to restore) instead of throwing, so [[AuthContext]] can treat "no session" as a normal, expected outcome on first load.
- `logout` mutation — `onQueryStarted` clears the token store immediately (optimistic — doesn't wait for the response), `invalidatesTags: ['Document', 'User']` (a logout changes which documents are visible, since they're now scoped to a fresh guest identity).
- `me`, `resendVerification`, `forgotPassword`, `resetPassword`, `verifyEmail` — straightforward passthroughs, no token-store side effects.
- Exported hooks: `useRegisterMutation`, `useLoginMutation`, `useRefreshMutation`, `useLogoutMutation`, `useMeQuery`, `useResendVerificationMutation`, `useForgotPasswordMutation`, `useResetPasswordMutation`, `useVerifyEmailMutation`.

## Source
`client/src/api/authApi.ts`

## Dependencies
- Imports: [[baseApi]], `setAccessToken` from `client/src/lib/token-store.ts`.
- Used by: [[AuthContext]] (`refresh`, `logout`), [[LoginPage]]/[[SignupPage]] (`login`/`register`), [[ForgotPasswordPage]]/[[ResetPasswordPage]]/[[VerifyEmailPage]] (their respective mutations).

## Related
- [[baseApi]]
- [[AuthContext]]
- [[auth.controller]]
- [[Auth-System]]

## Notes
`register`/`login`/`refresh` all set the token store as a `transformResponse` side effect rather than in the component that calls the hook — this means the token is available immediately to any *subsequent* API call fired from the same `.then()`/`await` chain, without waiting for a React re-render. Don't move that `setAccessToken` call into a component-level `useEffect` watching the mutation's data — that would introduce a render-cycle delay where other requests could fire with a stale/missing token.
