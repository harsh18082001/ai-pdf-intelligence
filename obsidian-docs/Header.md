---
tags: [frontend, component]
---
## Purpose
Sticky top navigation bar: app logo/home link + light/dark/system theme dropdown.

## Key Details
- `export function Header()` — no props.
- `useTheme()` from [[theme-provider]] gives `setTheme`; dropdown items call `setTheme('light' | 'dark' | 'system')`.
- Logo links to `/` via `react-router-dom`'s `Link`.
- Sun/Moon icons cross-fade via Tailwind `dark:` variants rather than conditional rendering.

## Source
`client/src/components/layout/Header.tsx`

## Dependencies
- Imports: [[theme-provider]] (`useTheme`), shadcn `Button`/`DropdownMenu`.
- Used by: [[Layout]].

## Related
- [[Layout]]
- [[theme-provider]]

## Notes
No auth/user menu here — there is no real user identity in this app, only the anonymous `clientId` (see [[AuthContext]]).
