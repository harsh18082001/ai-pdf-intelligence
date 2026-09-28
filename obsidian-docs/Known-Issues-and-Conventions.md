---
tags: [conventions]
---
## Purpose
Tacit context a fresh agent would otherwise have to rediscover the hard way — recent history, deliberate removals, and known gaps. Framed as "if you touch X, don't reintroduce Y."

## Key Details

### Document queries must stay scoped per owner (`RequestOwner`, not a raw string)
Every document-touching repository/service method now takes a `RequestOwner` (`{ type: 'user', id, email, name, role } | { type: 'guest', id }`, defined in `server/src/types/index.ts`), not a bare `clientId` string:
- [[document.repository]]`.findAll(owner)` / `.findRecent(owner, limit)` filter by `userId` or `guestSessionId` depending on `owner.type` — there's no "unscoped" path.
- [[document.repository]]`.findOwnedById(id, owner)` is the one ownership-checked lookup — it returns `null` (not the document) if the owner doesn't match. [[document.service]], [[chat.service]], and [[command.service]] all call this rather than the plain `findById` before doing anything with a document.
- If you add a new "fetch by ID" code path, call `findOwnedById`, don't reintroduce a manual `doc.userId !== owner.id` check inline — that's exactly the duplication that used to cause drift between endpoints (see the next section below, now closed).
- Don't reintroduce a global realtime/broadcast subscription (e.g. Supabase Realtime, a WebSocket fanout) that pushes document updates to all connected clients — a prior version of this leaked documents across users that way (`47d92bf`).

### Chat history and commands are now tenant-scoped too (previously a known gap — closed)
[[chat.service]]`.getHistory` and [[command.service]]`.execute` used to skip the ownership check that upload/list/chat-send already had. Both now take `owner: RequestOwner` and call `documentRepository.findOwnedById(documentId, owner)` first, same as every other document-touching path — there's no longer an endpoint that's reachable with just a numeric ID and no owner check.

### Auth is now real: email/password + server-issued guest sessions (see [[Auth-System]])
The old `clientId` — a random UUID the **browser** generated and sent as an `x-client-id` header — is gone. It was trivially spoofable (any client could claim any other client's documents by sending their id) and is no longer read anywhere in the codebase. Current identity model, see [[Auth-System]] for the full picture:
- **Guests**: [[guest-session.middleware]] issues a random id, HMAC-signs it with `GUEST_SESSION_SECRET`, and sets it as an httpOnly cookie (`dociq_guest_id`) — the server owns this value end-to-end, the browser can't forge or read it.
- **Users**: [[auth.service]] does Argon2id password hashing, short-lived JWT access tokens (in-memory on the client, never localStorage — see `client/src/lib/token-store.ts`), and rotating refresh tokens (httpOnly cookie, hashed at rest in the `Session` table, reuse-detected — see [[Model-Session]]).
- **Merge on login/register**: [[auth.service]]`.register`/`.login` call `documentRepository.migrateGuestDocuments(guestSessionId, userId)` automatically using the request's guest cookie — a guest never has to do anything to keep their work after signing up.
- `@supabase/supabase-js` (`lib/supabase.ts`) and `lib/user.ts`'s `getOrCreateUserId()` remain separate, unused dead files — still true, still not part of the real auth path, unaffected by this change.
- Don't reintroduce a polling `useEffect`/`setInterval` for identity or document status — the existing `Cache-Control: no-store` + RTK Query tag-invalidation pattern is still the intended mechanism.
- No global Supabase Realtime broadcast listener exists (deliberately removed per `47d92bf`) — don't add one back.

### CORS is origin-locked, not reflect-any-origin
`app.ts`'s `cors()` used to be configured with `origin: true` (reflects whatever `Origin` header the caller sends) plus `credentials: true` — a classic anti-pattern once cookies are involved, since it lets *any* site read cross-origin responses with the user's cookies attached. It's now `origin: env.CORS_ORIGIN` (a single explicit origin). If you need to support multiple frontend origins (e.g. preview deployments), extend `CORS_ORIGIN` handling into an allow-list function — don't go back to `origin: true`.

### CSRF: every mutating request needs the `x-csrf-token` header
[[csrf.middleware]] issues a non-httpOnly `dociq_csrf` cookie and requires it to be echoed back verbatim in an `x-csrf-token` header on any non-GET/HEAD/OPTIONS request (double-submit pattern — a cross-site page can trigger the request but can't read the cookie to put it in a header). [[baseApi]] already does this for every RTK Query mutation. If you add a new way of calling the API that bypasses `baseApi` (a raw `fetch`, a new SSE endpoint that mutates state), you must read `document.cookie` for `dociq_csrf` and set the header yourself, or the request will 403.

### Upload is synchronous end-to-end, not a background job
[[document.service]]`.upload()` `await`s the entire pipeline ([[processor]] → [[processing.service]]) before the HTTP response returns. This is intentional for Vercel serverless compatibility (background work would be killed once the response is sent). There is no queue, no job table, no polling endpoint wired up client-side (though [[document.service]]`.getProcessingStatus()` exists server-side, unused). Don't assume "add a progress bar" is a small change — it requires either a real background-job mechanism or a different serverless-compatible pattern (e.g. `waitUntil` + a status-polling endpoint).

### PDF preview: IndexedDB is still the primary path; B2 is a fallback, not a replacement
The raw PDF binary now *can* be persisted server-side — [[document.service]]`.upload()` uploads it to Backblaze B2 via [[b2-storage.service]] and stores the resulting `storageKey` on the `Document` row, and `GET /api/documents/:id/file` ([[document.controller]]`.getDocumentFileUrl`) returns a short-lived presigned URL for it. But [[PDFViewer]]/[[pdfStorage]] were **not** rewired to call this endpoint — the browser's IndexedDB copy (written at upload time, re-attachable per-device via "Attach PDF") is still what the viewer actually reads. B2 storage exists so a document survives across devices/guest→account migration even if IndexedDB doesn't have it, and so a future "no IndexedDB copy" fallback path is possible — it is not yet wired into [[PDFViewer]]. If `B2_KEY_ID`/`B2_APPLICATION_KEY`/`B2_ENDPOINT` aren't set, `storageKey` stays `null` and `getDocumentFileUrl` 404s — this is expected in local dev without B2 credentials.

### README is aspirational, not authoritative
`README.md` documents endpoint paths (`/api/documents/upload`, `/api/chat/:documentId`, `/api/commands/:documentId`) and a client env var (`VITE_API_BASE_URL`) that **do not match** the actual implemented routes/vars. Always trust the source (`server/src/routes/*`, `client/src/api/*`, `client/src/lib/supabase.ts` usage) over the README when in doubt — see [[API-Contract]] and [[ENV-Variables]] for the corrected, code-verified versions.

### Artifact types beyond the MVP three are schema-valid but not implemented
`ARTIFACT_TYPES` (`config/constants.ts`) lists `flashcards`, `quiz`, `interview_questions`, `resume_analysis` alongside `summary`/`key_points`/`insights`. Only the latter three have real prompt builders in [[templates]] and buttons in [[DocumentHeader]]'s "Actions" dropdown (formerly a stacked button list in the now-deleted `MetadataPanel`). Requesting one of the other four via the API validates successfully but [[command.service]]'s `switch` falls through to `default` and silently generates (and caches) a **summary** under that artifact type's name. If implementing one of these, add both a prompt builder (in [[templates]]) and a `case` in [[command.service]]'s switch — the schema/validation/DB layers already support it.

### Duplicated logic to be aware of, not "fix" reflexively
- ~~`getClientId(req)` copy-pasted in document.controller and chat.controller~~ — **removed** during the auth overhaul: both now read `req.owner`, populated once by [[guest-session.middleware]] + [[auth.middleware]] in `app.ts`, instead of each controller parsing headers itself.
- ~~Status-badge-config logic duplicated between DocumentCard and MetadataPanel~~ — **fixed** during the first UI polish pass: extracted to `lib/document-status.ts` + [[DocumentStatusBadge]], now shared by [[DocumentCard]] and [[DocumentHeader]] (`MetadataPanel` itself was later deleted entirely — see [[Frontend-Architecture#App shell — sidebar navigation, not a top header (redesign pass)]]).

### Fonts are self-hosted, not CDN-loaded (UI polish pass)
Previously `index.css` declared `font-family: 'Inter', system-ui...` but nothing ever loaded Inter — no `<link>`, no `@font-face` — so it silently fell back to `system-ui` everywhere. Fixed by installing `@fontsource-variable/inter` and `@fontsource-variable/fraunces` and importing both once in `main.tsx`. Don't add a Google Fonts `<link>` in `index.html` for either — that would fetch them a second time from a CDN this app deliberately avoids.

### Dialog/menu animate-in/out classes had no CSS backing until `tw-animate-css` was added (app-shell redesign)
`dialog.tsx`, `alert-dialog.tsx`, and `dropdown-menu.tsx` all reference `data-[state=open]:animate-in data-[state=open]:fade-in-0 ... zoom-in-95` etc. — these are not native Tailwind v4 utilities, and no plugin defined them, so those open/close transitions were silently inert (instant show/hide, no actual animation) for as long as the project existed. Fixed by adding the `tw-animate-css` package and `@import 'tw-animate-css';` in `index.css`. If you ever see `animate-in`/`fade-out-0`/`slide-in-from-*`/`zoom-in-*` classes not visibly animating, check that this import is still present before assuming a component bug.

### `react-resizable-panels` must stay pinned to v2 — v4 is a different, incompatible API
`npm install react-resizable-panels` with no version pin resolves to v4+, which rewrote the entire public API (`Group`/`Separator`/`orientation`/`defaultLayout` instead of the classic `PanelGroup`/`Panel`/`PanelResizeHandle`/`direction`/per-panel `defaultSize`). `components/ui/resizable.tsx` targets the classic v2 API — see [[Dependencies]]. Don't run a blanket dependency upgrade across this package without rewriting that file for whichever API the new major version ships.

### The sidebar was stretching taller than the viewport (min-h-screen vs h-screen)
[[Layout]]'s root shell originally used `min-h-screen` (a floor). Flexbox's default `align-items: stretch` means every sibling in an unbounded-height flex row grows to match the tallest one — so whenever a page's content (mobile [[DocumentPage]], a long grid) exceeded the viewport, the whole row grew and [[AppSidebar]]'s `<aside>` visibly stretched past the screen instead of staying pinned. Fixed by making the root `h-screen overflow-hidden` (a real cap) with `min-h-0` on the inner flex column and `<main>`, so `<main>`'s `overflow-auto` is the only thing that ever scrolls. If a future page's content looks like it's dragging the shell taller again, check for a `min-h-*`/unbounded-height container upstream before assuming it's that page's own bug.

### The sidebar collapse/expand had a text "flash" — fixed by not unmounting labels
The first version of [[AppSidebar]]'s collapsed rail conditionally rendered labels/counts as `{!collapsed && <span>...}` and swapped between two structurally different elements for things like the upload button and the collapse toggle itself (a button that appeared at a different position, or a completely different button in a different location, depending on state). Mounting/unmounting DOM nodes while the container's width is mid-transition is what produced the "text looks weird for a second" effect the user reported — the label would pop in/out abruptly, out of sync with the smooth width animation, and the toggle button jumping position made it worse. Fixed by (1) always rendering labels via a `SidebarLabel` helper that animates `max-width`/`opacity` instead of mounting/unmounting, with icons pinned at a fixed left offset so they never move horizontally, and (2) replacing the two swapping collapse/expand buttons with one persistent edge-mounted button (`position: absolute`, rotating chevron icon) that never changes position or identity. Don't reintroduce `{!collapsed && <span>}`-style conditional rendering for sidebar labels — animate them instead.

### The color palette was renamed "Ink & Ember" → "Glacier" (warm → cool, direct user feedback)
The first UI polish pass shipped a warm burnt-amber primary + ink-teal secondary on warm neutrals, codenamed "Ink & Ember". The user liked the overall redesign direction but explicitly asked for cool colors instead. Recolored in a follow-up pass — same token structure/names in `index.css`, only the OKLCH hue values changed (primary ~45→230, secondary ~200→275, neutrals ~80→240). See [[Frontend-Architecture#Design system — "Glacier" (`index.css`)]]. If you see "Ink & Ember"/"burnt-amber"/"ink-teal" in an old note or commit message, that's the pre-rename palette, not a second design system living somewhere.

### The palette is genuinely multi-color now, not just a different single hue (colorfulness feedback)
Even after the "Glacier" recolor, the user pointed out the app still read as monochromatic — one dominant hue family (blue) driving nearly everything visible, the same structural complaint whether that one hue was warm (Ember) or cool (Glacier). The fix was **not** inventing new brand hues; it was applying the tone tokens that already existed (`--success`/`--info`/`--warning`/`--destructive`) more visibly in places that were previously all-primary or all-muted-gray: [[AppSidebar]]'s status nav icons are now colored per status (green/cyan/amber/red/gray, not five gray icons), [[DocumentCard]]'s file-icon badge tints by the document's status tone instead of always `primary`, and [[HomePage]]'s stat row became colored icon chips. The brand mark (sidebar, [[TopBar]], favicon) also went from solid `primary` to a `primary→secondary` gradient. If asked to make the app "more colorful" again, prefer surfacing existing semantic tones more boldly (status-driven, meaningful) over adding arbitrary new decorative hues — that's what keeps multi-color from turning into visual noise.

### DocumentPage keeps the full sidebar, not a stripped-down version (rethought, kept as-is)
Asked to reconsider whether [[DocumentPage]] needs [[AppSidebar]] at all, given the sidebar's "Library" section (All Documents / status counts) is conceptually a HomePage browsing construct. Decision: keep it, unchanged, on every route — it also carries the brand mark, `⌘K` search/jump-to-any-document, upload-from-anywhere, and theme toggle, all of which stay useful mid-document. The alternative (auto-collapsing or simplifying it per-route) would add surprising, hard-to-predict behavior ("why did my sidebar just shrink when I opened a document"); the existing manual collapse toggle is the intended answer to "I want this space back on this screen," not automatic per-page logic. If a future ask specifically wants auto-collapse-on-DocumentPage, that's new, deliberate behavior to layer on top — not a sign this decision was wrong.

### DocumentPage was rebuilt because the workspace felt "compressed" (congestion feedback)
The first app-shell pass kept [[DocumentPage]]'s original two-stacked-cards layout (a `PageHeader` breadcrumb + a card-based `MetadataPanel` sitting above [[ChatInterface]], both crammed into a ~38%-width resizable pane). Direct user feedback: it looked like boxes had been "compressed forcefully" onto the screen. Fixed by merging the breadcrumb + metadata + AI-actions into one slim horizontal strip ([[DocumentHeader]]) and giving [[ChatInterface]] the *entire* left pane by itself. `PageHeader.tsx` and `MetadataPanel.tsx` were both deleted, not just visually hidden — don't resurrect either as a "quick fix" for a future DocumentPage change; extend [[DocumentHeader]] instead.

### The sidebar collapses to an icon rail — added specifically for content-dense pages like DocumentPage
Same feedback round raised a real question: should a persistent 256px-wide sidebar even exist on a dense, scrolly working screen? Rather than hide the sidebar per-route (which would make navigation disappear unpredictably), [[AppSidebar]] got a user-controlled collapse toggle (`w-64` ↔ `w-[68px]` icon rail, `localStorage['dociq-sidebar-collapsed']`) with `Tooltip`-on-hover labels in collapsed mode. This is a manual, persistent, cross-route preference — not automatic per-page collapsing. If a future ask wants pages to auto-collapse/expand the sidebar, that would be new behavior layered on top of this, not a replacement for it.

### Filter/sort state on HomePage lives in the URL, not local useState (app-shell redesign)
[[HomePage]] reads/writes `search`/`statusFilter`/`sortBy` via `useSearchParams()` rather than `useState`, specifically so [[AppSidebar]]'s status-filter nav links can be plain, real, bookmarkable `<Link to="/?status=completed">` navigation instead of needing some cross-component state-sharing mechanism. If you add a new HomePage filter dimension, follow the same pattern (a URL param + the `updateParam` helper) rather than introducing local state that a sidebar link couldn't address.

### `react-helmet-async` doesn't support React 19 — don't try to reinstall it
It was the first choice for per-page `<title>`/meta/JSON-LD (SEO pass), but its peer range tops out at React 18 and installing it under React 19 throws an `ERESOLVE` error. Replaced with a ~40-line hand-rolled hook, [[useDocumentHead]], that does the same job (imperatively sets `document.title` + a handful of `<meta>` tags + an optional JSON-LD `<script>`, and reverts on unmount) without any dependency. Don't add `react-helmet-async`, `react-helmet`, or similar back for this — check whichever one you're considering actually lists React 19 in its peer deps first, and if the need grows beyond "two pages' worth of title/meta," reconsider then.

## Source
Derived from git history (`47d92bf`, `2d1da58`) plus direct code reading across `client/src` and `server/src`.

## Dependencies
N/A — this is a cross-cutting index of gotchas.

## Related
- [[document.service]]
- [[document.repository]]
- [[chat.service]]
- [[command.service]]
- [[AuthContext]]
- [[Auth-System]]
- [[guest-session.middleware]]
- [[csrf.middleware]]
- [[b2-storage.service]]
- [[lib-supabase]]
- [[lib-user]]
- [[processor]]
- [[pdfStorage]]
- [[useDocumentHead]]
- [[API-Contract]]
- [[ENV-Variables]]
- [[Dependencies]]
- [[HomePage]]
- [[AppSidebar]]
- [[DocumentHeader]]
- [[DocumentPage]]

## Notes
This file should be updated whenever a future change closes one of the gaps above or reintroduces one — remove the stale caveat rather than leaving it to rot once fixed. The tenant-scoping and clientId-auth gaps this file used to describe as open are now closed (see the auth overhaul entries above) — if you're reading this after another round of changes, verify these claims against the current code rather than trusting them indefinitely.
