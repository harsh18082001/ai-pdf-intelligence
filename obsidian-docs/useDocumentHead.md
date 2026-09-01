---
tags: [frontend, hook, seo]
---
## Purpose
Minimal, dependency-free per-page `<title>`/meta/JSON-LD manager — the SEO pass's answer to "we need dynamic head tags but `react-helmet-async` doesn't support React 19."

## Key Details
- `useDocumentHead({ title, description?, robots?, jsonLd? })` — a `useEffect` that imperatively sets `document.title`, upserts `<meta name="description">`/`<meta property="og:title">`/`<meta property="og:description">` (via `setMetaTag`, which finds-or-creates the tag), optionally `<meta name="robots">`, and optionally appends a `<script type="application/ld+json">` with `jsonLd` serialized.
- Cleanup function restores the previous `document.title`, removes the `robots` meta tag it added (if any), and removes the JSON-LD `<script>` it appended — so navigating between pages doesn't accumulate stale tags or leave a `noindex` from a previous page stuck in place.
- Used at two call sites: `App.tsx` (site-wide title/description/JSON-LD `SoftwareApplication` schema) and [[DocumentPage]] (per-document title + `noindex, nofollow`, since document content is private).

## Source
`client/src/hooks/useDocumentHead.ts`

## Dependencies
- No external imports beyond React's `useEffect`.
- Used by: `App.tsx`, [[DocumentPage]].

## Related
- [[DocumentPage]]
- [[Known-Issues-and-Conventions#`react-helmet-async` doesn't support React 19 — don't try to reinstall it]]

## Notes
This intentionally does **not** try to be a general-purpose head-management library (no provider, no SSR support, no dedup across simultaneously-mounted components) — it's sized for exactly two call sites. If a third or fourth page needs dynamic head tags and the pattern starts feeling repetitive, that's the point to reconsider a real library — re-check its React 19 peer-dep support first (see the linked Known-Issues entry) rather than assuming the same conflict is still there.
