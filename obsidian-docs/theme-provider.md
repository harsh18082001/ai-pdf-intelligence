---
tags: [frontend, component]
---
## Purpose
Light/dark/system theme context provider — persists choice to localStorage and toggles the `light`/`dark` class on `<html>`.

## Key Details
- `ThemeProvider({ children, defaultTheme = 'system', storageKey = 'vite-ui-theme', ...props })`. In this app, `main.tsx` instantiates it with `defaultTheme="system"` and `storageKey="dociq-theme"`.
- `Theme = 'dark' | 'light' | 'system'`.
- On mount and on every `theme` change: removes `light`/`dark` classes from `document.documentElement`, then adds the resolved one — `system` resolves via `window.matchMedia('(prefers-color-scheme: dark)')`.
- `useTheme()` hook — throws if called outside the provider — returns `{ theme, setTheme }`; `setTheme` writes to `localStorage[storageKey]` before updating state.

## Source
`client/src/components/theme-provider.tsx`

## Dependencies
- Used by: `main.tsx` (wraps the whole app, inside `BrowserRouter`, outside `AuthProvider`), [[Header]] (consumes `useTheme`).

## Related
- [[Header]]
- [[Frontend-Architecture#App bootstrap order]]

## Notes
Storage key is `dociq-theme` in this app, not the component's own default (`vite-ui-theme`) — don't assume the default when debugging localStorage.
