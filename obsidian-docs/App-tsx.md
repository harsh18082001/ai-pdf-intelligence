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
  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignupPage />} />
  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
  <Route path="/reset-password" element={<ResetPasswordPage />} />
  <Route path="/verify-email" element={<VerifyEmailPage />} />
</Routes>
```
The five auth routes (**new**) are deliberately **siblings** of the `Layout` route, not nested inside it — they render their own full-page [[AuthLayout]] chrome instead of the sidebar/topbar shell, since a login screen shouldn't show a document sidebar. Also calls `useDocumentHead(...)` ([[useDocumentHead]]) once, site-wide, for the base title/description/JSON-LD `SoftwareApplication` schema (SEO pass) — [[DocumentPage]] overrides it per-document.

## Related additions
- [[LoginPage]] / [[SignupPage]] / [[ForgotPasswordPage]] / [[ResetPasswordPage]] / [[VerifyEmailPage]]
- [[useDocumentHead]]

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
Adding a new top-level page that should share the sidebar/Toaster/page-transition app shell means nesting it inside the `Layout` route, not as a sibling — that's still true. The five auth pages are the deliberate exception (siblings, own chrome) precisely because they shouldn't share that shell — don't "fix" them to be nested under `Layout` without re-deciding that intentionally.
