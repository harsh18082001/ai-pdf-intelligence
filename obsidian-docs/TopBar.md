---
tags: [frontend, component]
---
## Purpose
Top bar: mobile hamburger + compact brand mark (mobile only), and the auth menu — login/signup buttons for a guest, a user dropdown (email + logout) for a logged-in user. **No longer `lg:hidden` at the root** — it's visible on every viewport now, since desktop needs somewhere to show the auth state too.

## Key Details
- `TopBar({ onOpenMobileNav }: TopBarProps)` — `onOpenMobileNav: () => void`, called on hamburger click; open/close state still lives in [[Layout]].
- Hamburger button and the brand-mark `<Link>` are individually `lg:hidden` now (not the whole `<header>`) — at desktop widths, only the auth menu renders, right-aligned via `ml-auto`.
- Reads `useAuth()` ([[AuthContext]]): `isLoading` suppresses the whole auth UI (avoids a "Log in" flash before the `/auth/refresh` restore call settles); `user` present → `DropdownMenu` with the email as a label and a "Log out" item calling `logout()` then navigating home; `user` absent → "Log in"/"Sign up" links to `/login`/`/signup`.
- Still uses `.glass` + `sticky top-0`.

## Source
`client/src/components/layout/TopBar.tsx`

## Dependencies
- Imports: `react-router-dom` (`Link`, `useNavigate`), `lucide-react` icons, `Button`, `DropdownMenu*` ui primitives, [[AuthContext]] (`useAuth`).
- Used by: [[Layout]] (rendered above `<main>`, alongside [[AppSidebar]]).

## Related
- [[Layout]]
- [[AppSidebar]]
- [[AuthContext]]
- [[LoginPage]]
- [[SignupPage]]

## Notes
Search/theme toggle still live inside the mobile drawer ([[AppSidebar]]'s `SidebarContent`), not here — unchanged. The auth menu is the only thing this bar renders at desktop widths; it used to render nothing at all there.
