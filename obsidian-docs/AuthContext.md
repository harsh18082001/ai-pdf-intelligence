---
tags: [frontend, auth]
---
## Purpose
Generates and persists an anonymous per-browser `clientId` used as the app's entire identity/tenancy mechanism. **This is not Supabase Auth** — see Notes.

## Key Details
- `getStoredClientId(): string` — reads `localStorage['dociq_client_id']`; if missing/blank, generates `'usr_' + crypto.randomUUID()` and stores it. Called once in `main.tsx` before the React tree renders (`getStoredClientId()` at module scope) so the ID exists before any API call, and again inside `AuthProvider`'s initial state.
- `interface AuthContextType { clientId: string }`
- `AuthProvider({ children })` — `useState(() => getStoredClientId())`, plus a mount-time `useEffect` that re-reads and re-sets (a no-op in practice since the ID already exists by then).
- `useAuth()` — throws if used outside `AuthProvider`; returns `{ clientId }`.
- Mounted in `main.tsx` innermost, wrapping `<App />`, inside `ThemeProvider`, inside `BrowserRouter`, inside the Redux `<Provider>`.

## Source
`client/src/context/AuthContext.tsx`

## Dependencies
- Used by: `main.tsx` (provider mount + calls `getStoredClientId()` directly before render).
- The `clientId` value itself is actually consumed on the network side by [[baseApi]] (reads `localStorage['dociq_client_id']` directly, not via `useAuth()`) and by [[useChat]] (same, for the `EventSource` URL).
- Backend reads it as the `x-client-id` header (or `clientId` query/body) — see [[document.controller]], [[chat.controller]] `getClientId()`.

## Related
- [[baseApi]]
- [[useChat]]
- [[document.controller]]
- [[Data-Flow#4. Auth / identity flow]]
- [[Known-Issues-and-Conventions#Supabase client is installed but unused]]

## Notes
**No component actually calls `useAuth()`** — every real consumer reads `localStorage.getItem('dociq_client_id')` directly instead of going through the context. The context/provider exist but are effectively vestigial; the localStorage key is the real source of truth. `lib/supabase.ts` and `lib/user.ts` are separate, **unused** files that look related to auth but are dead code (nothing imports them) — do not assume Supabase session auth is wired up anywhere in this app. If you add real Supabase auth later, this is the file to replace, and every direct `localStorage.getItem('dociq_client_id')` call site (`baseApi.ts`, `useChat.ts`) would need to move to reading from it instead.
