---
tags: [frontend, architecture]
---
## Purpose
Top-level route definitions for the whole client app.

## Key Details
```tsx
<Routes>
  <Route path="/" element={<Layout />}>
    <Route index element={<HomePage />} />
    <Route path="documents/:id" element={<DocumentPage />} />
  </Route>
</Routes>
```
Two pages total, both nested under [[Layout]] so they share the sidebar/toaster/page-transition app shell. See [[Frontend-Architecture#Routing table]] for the full table.

## Source
`client/src/App.tsx`

## Dependencies
- Imports: [[Layout]], [[HomePage]], [[DocumentPage]].
- Rendered by: `main.tsx`, inside `BrowserRouter` → `ThemeProvider` → `AuthProvider`.

## Related
- [[Layout]]
- [[HomePage]]
- [[DocumentPage]]
- [[Frontend-Architecture]]

## Notes
Adding a new top-level page means adding a `<Route>` here, nested inside the `Layout` route, not as a sibling — a route added as a sibling of `path="/"` would render without the sidebar/Toaster/page-transition.
