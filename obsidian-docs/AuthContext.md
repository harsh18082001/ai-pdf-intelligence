---
tags: [frontend, auth]
---
## Purpose
React context that tracks the current session (logged-in user or guest) on the client. Restores the session on load by calling `/auth/refresh` against the httpOnly refresh cookie — **no token or identity is ever read from `localStorage`** (this replaced the old client-generated `clientId` scheme; see [[Known-Issues-and-Conventions#Auth is now real: email/password + server-issued guest sessions]]).

## Key Details
- `interface AuthContextType { user: UserDTO | null; isGuest: boolean; isLoading: boolean; setUser; logout }`
- `AuthProvider({ children })` — on mount, calls `useRefreshMutation()` once; success sets `user`, failure (no valid refresh cookie, i.e. a guest) leaves `user` as `null`. `isLoading` is true until that first refresh settles — [[TopBar]] uses it to avoid flashing "Log in" before the real state is known.
- `logout()` — calls `/auth/logout` (revokes the session server-side, clears the refresh cookie) then clears local `user` state.
- `useAuth()` — throws if used outside `AuthProvider`. Returns the object above.
- Mounted in `main.tsx`, wrapping `<App />`.

## Source
`client/src/context/AuthContext.tsx`

## Dependencies
- Used by: [[TopBar]] (login/signup buttons vs. user menu + logout), [[LoginPage]]/[[SignupPage]] (`setUser` after a successful call).
- Calls: [[authApi]] (`useRefreshMutation`, `useLogoutMutation`).
- The actual access token lives in `client/src/lib/token-store.ts` (module-scope variable, in-memory only) — [[baseApi]] reads it from there, not from this context.

## Related
- [[authApi]]
- [[baseApi]]
- [[TopBar]]
- [[LoginPage]]
- [[SignupPage]]
- [[auth.service]]
- [[Data-Flow#4. Auth / identity flow]]

## Notes
This file used to generate and own a `dociq_client_id` in `localStorage`; it no longer does. Identity for unauthenticated visitors ("guest mode") is now issued entirely server-side as a signed, httpOnly `dociq_guest_id` cookie (see [[guest-session.middleware]]) — the frontend has no code path that reads, writes, or forwards a client-chosen identity string anymore. `lib/supabase.ts` and `lib/user.ts` are still separate, unused dead files (unaffected by this change, not part of the real auth path) — don't assume Supabase session auth is wired up anywhere in this app.
