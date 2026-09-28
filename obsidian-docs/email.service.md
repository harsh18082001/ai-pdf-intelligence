---
tags: [backend, service, auth]
---
## Purpose
Thin Gmail-SMTP (via `nodemailer`) wrapper for the two auth emails (verify, reset). Has a safe no-op-but-visible fallback when Gmail isn't configured. Switched from Resend because Resend requires a verified custom domain to send to arbitrary recipients, which this project doesn't have.

## Key Details
- `sendVerificationEmail(to, token)` / `sendPasswordResetEmail(to, token)` — build a link (`${APP_BASE_URL}/verify-email?token=...` / `/reset-password?token=...`), render it through [[email-template]]'s `renderEmailTemplate()` (branded HTML card: gradient header, CTA button, fallback link, footnote), and call `private send(to, subject, html)`.
- `send(...)`: if `GMAIL_USER`/`GMAIL_APP_PASSWORD` are unset, `transporter` is `null` at module scope — logs a warning plus the full email content via [[logger]] instead of sending, and returns. Otherwise calls `transporter.sendMail({ from: EMAIL_FROM, to, subject, html })` via `nodemailer.createTransport({ service: 'gmail', auth: {...} })`, catching and logging (not throwing) any SMTP error — a flaky email provider should never fail the register/login/reset request itself.
- Requires a Gmail **App Password** (not the account password) — 2-Step Verification must be enabled on the Google account first, then generate one at https://myaccount.google.com/apppasswords.

## Source
`server/src/services/email.service.ts`

## Dependencies
- Imports: `nodemailer`, `env`, `logger`, [[email-template]].
- Called by: [[auth.service]] (`sendVerificationEmail`, `resendVerification`, `forgotPassword`).

## Related
- [[auth.service]]
- [[ENV-Variables]]
- [[Auth-System]]

## Notes
In local dev without `GMAIL_USER`/`GMAIL_APP_PASSWORD` set, "sending" an email just logs it — check the server log/console for the verification or reset link rather than expecting an actual inbox delivery. This is deliberate, not a bug to fix by requiring the credentials.
