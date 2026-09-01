---
tags: [backend, service, auth]
---
## Purpose
Table-based HTML email template shared by both auth emails (verify, reset) — branded card matching the app's "Glacier" cool-blue palette, instead of raw `<p>` tags.

## Key Details
- `renderEmailTemplate({ heading, intro, ctaLabel, ctaLink, footnote }): string` — pure function, no I/O. Returns a full `<html>` document.
- Layout: outer `<table>` for background + centering (email clients don't reliably support flex/grid), a white rounded card with a gradient header (`#1e3a8a → #3730a3`, matching `--primary`/`--secondary` from `client/src/index.css`), heading + intro copy, a gradient CTA button, a plain-text fallback link (for clients that strip `<a>` styling), and a footnote row.
- All styles are inline (`style="..."` per element) — email clients strip `<style>` blocks and external CSS, so this is a hard requirement, not a preference.

## Source
`server/src/services/email-template.ts`

## Dependencies
- Imports: none.
- Used by: [[email.service]] (`sendVerificationEmail`, `sendPasswordResetEmail`).

## Related
- [[email.service]]
- [[Auth-System]]

## Notes
Keep this template table-based and inline-styled if you touch it — `<div>`+flexbox layouts and `<style>` blocks render inconsistently (or not at all) across Gmail/Outlook/Apple Mail.
