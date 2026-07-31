---
tags: [config]
---
## Purpose
Key third-party libraries on both sides and the specific reason each is used in *this* project (not a generic description).

## Key Details

### Client (`client/package.json`)
| Library | Version | Why it's here |
|---|---|---|
| `react`, `react-dom` | `^19.2.7` | UI runtime. |
| `vite`, `@vitejs/plugin-react` | `^8.1.1` | Dev server + build tooling. |
| `react-router-dom` | `^7.18.1` | Client-side routing for the two pages ([[App-tsx]]). |
| `@reduxjs/toolkit`, `react-redux` | `^2.12.0` / `^9.3.0` | State container; in practice used almost entirely for RTK Query's API cache ([[baseApi]]) — no hand-written slices exist ([[store]]). |
| `@supabase/supabase-js` | `^2.110.6` | Installed for Supabase auth, but **unused** — see [[lib-supabase]]. The project's only confirmed real use of Supabase is as the hosted Postgres provider (server-side `DATABASE_URL`), unrelated to this package. |
| `react-pdf` | `^10.4.1` | Renders the cached PDF binary in [[PDFViewer]] (canvas-based, via PDF.js under the hood). |
| `idb` | `^8.0.3` | Promise-based IndexedDB wrapper — backs [[pdfStorage]], the client-side "don't re-download the PDF" cache. |
| `react-markdown`, `remark-gfm` | `^10.1.0` / `^4.0.1` | Renders AI-generated Markdown (chat replies, summaries/insights) safely as React elements instead of raw HTML — used in [[ChatMessage]] and [[DocumentHeader]]. |
| `sonner` | `^2.0.7` | Toast notifications (success/error) across upload, delete, chat, and command flows. |
| `tailwindcss` v4, `@tailwindcss/vite`, `tailwind-merge`, `clsx`, `class-variance-authority` | — | Styling system + the `cn()` helper ([[lib-utils|lib/utils.ts]]) for conditional class merging. |
| `radix-ui` / `@radix-ui/react-alert-dialog` | — | Headless accessible primitives underlying `components/ui/*` (shadcn/ui wrappers). |
| `lucide-react` | `^1.23.0` | Icon set used throughout components. |
| `@fontsource-variable/inter`, `@fontsource-variable/fraunces` | `^5.3.0` | Self-hosted variable fonts (imported once in `main.tsx`) backing the "Glacier" design system's `--font-sans`/`--font-serif` tokens — see [[Frontend-Architecture#Design system — "Glacier" (`index.css`)]]. Deliberately not a Google Fonts `<link>`, to avoid an external CDN request. |
| `next-themes` | `^0.4.6` | Present in dependencies but the app's actual theme logic is a **hand-rolled** context in [[theme-provider]], not this package — appears to be an unused/leftover dependency (no import of `next-themes` found anywhere in `client/src`). |
| `framer-motion` | `^12.43.0` | Motion library added for the app-shell redesign: route fade/slide transitions ([[PageTransition]]), the sidebar's sliding active-nav indicator ([[AppSidebar]]), the mobile nav drawer ([[MobileSidebarSheet]]), and the document-grid stagger-in entrance ([[DocumentList]]). |
| `cmdk` | `^1.1.1` | Powers the `⌘K`/`Ctrl K` command palette ([[command-palette]]) — the same primitive used by Linear/Vercel-style command menus. Wrapped by the local `components/ui/command.tsx` (standard shadcn recipe). |
| `react-resizable-panels` | `^2.1.9` (pinned) | Draggable split panes on [[DocumentPage]] (desktop only). **Pinned to v2** deliberately — v4 (npm's default "latest" at the time this was added) ships a fully rewritten API (`Group`/`Separator`/`orientation` instead of `PanelGroup`/`PanelResizeHandle`/`direction`) that the standard shadcn `resizable.tsx` recipe does not target. Don't blindly `npm update` this package without rewriting `components/ui/resizable.tsx` for the new API first. |
| `tw-animate-css` | `^1.4.0` | CSS-only package backing the `animate-in`/`animate-out`/`fade-in-0`/`zoom-in-95`/etc. utility classes already referenced by `dialog.tsx`/`alert-dialog.tsx`/`dropdown-menu.tsx`. Before this was added, those classes had no definitions anywhere in the project (Tailwind v4 doesn't ship them, and no plugin provided them) — dialog/menu open/close transitions were silently inert. Imported once via `@import 'tw-animate-css';` in `index.css`. |

### Server (`server/package.json`)
| Library | Version | Why it's here |
|---|---|---|
| `express` | `^5.1.0` | HTTP framework. |
| `@prisma/client`, `prisma` | `^6.9.0` | Type-safe ORM against Postgres; schema in `server/prisma/schema.prisma` ([[Model-Document]] etc.). |
| `@google/generative-ai` | `^0.24.1` | Gemini SDK — chat completion, streaming, and embeddings, wrapped by [[gemini.provider]]. |
| `@pinecone-database/pinecone` | `^8.0.0` | Vector similarity search for RAG retrieval — [[pinecone.service]] stores chunk embeddings and queries top-K matches per chat message. |
| `unpdf` | `^1.6.2` | Server-side PDF text extraction (PDF.js core, no native bindings/canvas needed) — used once, in [[processing.service]], to pull raw text out of an uploaded PDF. |
| `zod` | `^3.25.34` | Runtime schema validation for both env vars ([[Backend-Architecture]]`config/env.ts`) and request bodies ([[validation]]). |
| `express-fileupload` | `^1.5.2` | Parses `multipart/form-data` uploads into `req.files`, in-memory (`useTempFiles: false`) — see [[upload]]. |
| `express-rate-limit` | `^7.5.0` | IP-based request throttling — [[rate-limiter]]. |
| `helmet` | `^8.1.0` | Sets security-related HTTP headers. |
| `cors` | `^2.8.5` | CORS middleware (currently configured to reflect any origin — see [[ENV-Variables]] `CORS_ORIGIN` note). |
| `pino`, `pino-pretty` | `^9.7.0` / `^13.0.0` | Structured JSON logging in production, human-readable in development — [[processor|utils/logger.ts]]. |
| `dotenv` | `^16.5.0` | Loads `.env` files (from two candidate paths) before Zod validation in `config/env.ts`. |
| `uuid` | `^11.1.0` | Listed as a dependency but **no import of `uuid` found** in `server/src` — client IDs are generated with the browser's native `crypto.randomUUID()` instead, client-side. Appears unused server-side. |
| `jest`, `ts-jest`, `supertest` (dev) | — | Test tooling; `npm run test`/`test:integration` scripts exist in `package.json` but **no test files were found under `server/`** in this pass — tests may not yet be written. |

## Source
`client/package.json`, `server/package.json`

## Dependencies
N/A (this note is itself the dependency reference).

## Related
- [[Frontend-Architecture]]
- [[Backend-Architecture]]
- [[ai.service]]
- [[pinecone.service]]
- [[processing.service]]

## Notes
Three dependencies look plausibly unused from a repo-wide read: client's `next-themes` (real theme logic is hand-rolled in [[theme-provider]]), client's `@supabase/supabase-js` (see [[lib-supabase]]), and server's `uuid`. Verify with a fresh `grep` before removing any of them, since this was a single-pass read, not an exhaustive dependency-usage audit.
