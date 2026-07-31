---
tags: [backend, middleware]
---
## Purpose
Two `express-rate-limit` instances: a general one for all API traffic, a stricter one for AI-calling routes.

## Key Details
- `generalLimiter` — `windowMs: 15 * 60 * 1000` (15 min), `limit: 100` requests/IP. Applied globally in `app.ts` (`app.use(generalLimiter)`, before `/api` routes) — i.e. it covers every endpoint including document upload/list/get/delete.
- `aiLimiter` — `windowMs: 60 * 1000` (1 min), `limit: 20` requests/IP. Applied via `router.use(aiLimiter)` inside [[chat.routes]] and [[command.routes]] only — so those routes are subject to **both** limiters stacked (100/15min general, plus 20/min AI-specific).
- Both use `standardHeaders: 'draft-8'`, `legacyHeaders: false` (modern `RateLimit-*` headers, no deprecated `X-RateLimit-*`).
- Both return a JSON body matching `ApiResponse` shape on limit-exceeded (`{ success: false, error: '...' }`) — note this bypasses `errorHandler` entirely; `express-rate-limit` sends its own response directly.
- Rate limiting keys on IP; `app.ts` sets `app.set('trust proxy', 1)` specifically so the real client IP (not Vercel's proxy IP) is used for this — see `app.ts` comment "Trust reverse proxy (Vercel) for accurate client IP in rate limiting".

## Source
`server/src/middlewares/rate-limiter.ts`

## Dependencies
- Imports: `express-rate-limit`.
- Used by: `app.ts` (`generalLimiter`, globally), [[chat.routes]] and [[command.routes]] (`aiLimiter`).

## Related
- [[chat.routes]]
- [[command.routes]]
- [[Backend-Architecture#Request lifecycle]]

## Notes
Rate limiting is purely IP-based, not `clientId`-based — multiple anonymous users behind the same NAT/corporate IP share the same limit bucket. [[document.routes]] is only covered by `generalLimiter` (100/15min), not `aiLimiter` — uploads are not separately throttled beyond the general limit even though they trigger an expensive synchronous AI pipeline (embeddings generation) under the hood.
