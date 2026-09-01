---
tags: [home]
---
## Purpose
Master index for the DocIQ (`ai-pdf-intelligence`) codebase vault — an AI-PDF RAG platform with real email/password auth and guest mode. Start here.

## Tech Stack
**Frontend** (`client/`): React 19, Vite, TypeScript, Redux Toolkit + RTK Query, react-router-dom v7, Supabase JS client (installed, **unused** — see [[lib-supabase]]), react-pdf, Tailwind v4, shadcn/radix-ui, `idb` (IndexedDB), react-markdown, self-hosted variable fonts (`@fontsource-variable/inter` + `@fontsource-variable/fraunces`), `framer-motion` (route/UI motion), `cmdk` (command palette), `react-resizable-panels` (pinned to v2 — see [[Dependencies]]), `tw-animate-css` (backs the dialog/menu animate-in/out classes) — see [[Frontend-Architecture]]. No `react-helmet-async` — see [[useDocumentHead]] and [[Known-Issues-and-Conventions]] for why (React 19 peer-dep conflict).

**Backend** (`server/`): Express 5, Prisma ORM → PostgreSQL (Supabase-hosted, via both a pooled `DATABASE_URL` and a direct `DIRECT_URL` for migrations — see [[ENV-Variables]]), Google Gemini (`@google/generative-ai`) for LLM inference, Pinecone (vector DB) for embeddings/retrieval, `unpdf` for PDF text extraction, zod for validation, pino for logging, `argon2` (password hashing), `jsonwebtoken` (access/refresh tokens), `cookie-parser`, `resend` (auth emails), `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (Backblaze B2 original-file storage), express-fileupload, helmet, express-rate-limit.

**Auth**: real email/password accounts (Argon2id hashing, JWT access + rotating refresh tokens, httpOnly cookies) **plus** first-class guest mode (a server-issued, HMAC-signed guest session cookie — not a client-generated string). Guest documents merge into an account automatically on login/register. See [[Auth-System]] — the hub note for all of this. **Not** Supabase session auth, despite the Supabase JS client being installed (still unused, still dead code).

## Folder Structure
```
ai-pdf-intelligence/
├── client/src/
│   ├── api/            → baseApi, authApi, chatApi, commandApi, documentApi
│   ├── components/
│   │   ├── auth/        → AuthLayout, FormField (auth page chrome)
│   │   ├── chat/       → ChatInput, ChatInterface, ChatMessage
│   │   ├── documents/  → DocumentCard, DocumentHeader, DocumentList, DocumentStatusBadge, DocumentToolbar, PDFViewer, UploadDropzone, UploadModal (MetadataPanel retired/deleted)
│   │   ├── layout/     → AppSidebar, TopBar, MobileSidebarSheet, PageTransition, Layout (Header, PageHeader retired/deleted)
│   │   ├── command-palette.tsx
│   │   ├── theme-provider.tsx
│   │   └── ui/         → shadcn/ui primitives (not individually documented, except EmptyState — see Frontend-Architecture)
│   ├── context/        → AuthContext (real session, not a fake clientId anymore)
│   ├── hooks/          → useChat, useMediaQuery, useRecentDocuments (server-backed), useDocumentHead
│   ├── lib/            → supabase (unused), user (unused), utils, document-status, token-store
│   ├── pages/
│   │   ├── auth/        → LoginPage, SignupPage, ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage
│   │   ├── HomePage, DocumentPage
│   ├── services/       → pdfStorage
│   ├── store/          → store, hooks
│   └── types/          → shared DTOs
├── server/src/
│   ├── ai/             → ai.service, ai.types, prompts/templates, providers/gemini.provider, providers/index
│   ├── config/         → constants, env
│   ├── controllers/     → auth, document, chat, command
│   ├── middlewares/    → guest-session, auth, csrf, error-handler, rate-limiter, upload, validation
│   ├── repositories/   → user, session, verification-token, document, chunk, message, ai-artifact
│   ├── routes/         → index, auth, document, chat, command
│   ├── services/       → auth, email, b2-storage, document, chat, command, processing, pinecone
│   ├── utils/          → async-handler, chunker, logger, crypto, jwt, cookies, owner
│   ├── workers/        → processor
│   ├── app.ts, index.ts, db.ts
│   └── prisma/schema.prisma → User, Session, VerificationToken, Document, Chunk, Message, AIArtifact
└── obsidian-docs/      → this vault
```

## Start here for...

- **A chat bug** → [[useChat]] → [[ChatInterface]] → [[chat.controller]] → [[chat.service]] → [[templates]] → [[Data-Flow#2. Chat message flow]]
- **An upload/processing bug** → [[UploadModal]] → [[document.controller]] → [[document.service]] → [[processor]] → [[processing.service]] → [[Data-Flow#1. Upload flow]]
- **A "summary/insights/key points" bug** → [[DocumentHeader]] (Actions dropdown) → [[command.controller]] → [[command.service]] → [[templates]] → [[Data-Flow#5. Command flow]]
- **A document list/view bug** → [[DocumentList]] / [[DocumentPage]] → [[documentApi]] → [[document.routes]] → [[document.repository]] → [[Model-Document]]
- **A navigation/sidebar/filter bug** → [[AppSidebar]] (status nav + counts + recent) → [[HomePage]] (URL-synced filter state) → [[DocumentToolbar]] / [[command-palette]]
- **A PDF preview/rendering bug** → [[PDFViewer]] → [[pdfStorage]] (client-only IndexedDB is still primary — see [[Known-Issues-and-Conventions]])
- **An auth/login/signup bug** → [[Auth-System]] (start here) → [[AuthContext]] / [[authApi]] on the client, [[auth.controller]] → [[auth.service]] on the server
- **A "guest documents didn't merge into my account" bug** → [[auth.service]]`.register`/`.login` → `documentRepository.migrateGuestDocuments` → [[guest-session.middleware]] (is `req.guestId` even the same guest session the user was uploading under?)
- **A "logged out unexpectedly" bug** → [[auth.service]]`.refresh()` (reuse-detection revokes all sessions — check server logs for "Refresh token reuse detected") → [[baseApi]]'s reauth wrapper
- **A 403 on a form submit** → [[csrf.middleware]] — check the `x-csrf-token` header is being sent (it is, automatically, if the call goes through [[baseApi]])
- **A SEO/meta-tag/indexing question** → [[useDocumentHead]] → `App.tsx` / [[DocumentPage]] → `client/public/{robots.txt,sitemap.xml}`
- **Adding a new API endpoint** → [[API-Contract]] for the existing contract shape, then the matching `*.routes.md`/`*.controller.md`/`*.service.md` trio
- **A new env var** → [[ENV-Variables]]
- **"Why does X work this way"** → [[Known-Issues-and-Conventions]] first, always

## All Notes

### Cross-cutting
- [[API-Contract]]
- [[Data-Flow]]
- [[ENV-Variables]]
- [[Dependencies]]
- [[Known-Issues-and-Conventions]]
- [[Auth-System]]

### Frontend architecture
- [[Frontend-Architecture]]
- [[App-tsx]]
- [[store]]
- [[store-hooks]]
- [[lib-utils]]

### Frontend — pages
- [[HomePage]]
- [[DocumentPage]]
- [[LoginPage]]
- [[SignupPage]]
- [[ForgotPasswordPage]]
- [[ResetPasswordPage]]
- [[VerifyEmailPage]]

### Frontend — components
- [[ChatInput]]
- [[ChatInterface]]
- [[ChatMessage]]
- [[DocumentCard]]
- [[DocumentHeader]]
- [[DocumentList]]
- [[DocumentStatusBadge]]
- [[DocumentToolbar]]
- [[EmptyState]]
- [[PDFViewer]]
- [[UploadDropzone]]
- [[UploadModal]]
- [[AppSidebar]]
- [[TopBar]]
- [[MobileSidebarSheet]]
- [[PageTransition]]
- [[command-palette]]
- [[Layout]]
- [[theme-provider]]
- [[AuthLayout]] (also covers `FormField`)
- [[Header]] (retired)
- [[PageHeader]] (retired)
- [[MetadataPanel]] (retired)

### Frontend — hooks, API services, context/lib/services/store
- [[useChat]]
- [[baseApi]]
- [[authApi]]
- [[chatApi]]
- [[commandApi]]
- [[documentApi]]
- [[AuthContext]]
- [[lib-supabase]]
- [[lib-user]]
- [[document-status]]
- [[recent-documents]] (retired — see [[useRecentDocuments]])
- [[useMediaQuery]]
- [[useRecentDocuments]]
- [[useDocumentHead]]
- [[pdfStorage]]

### Backend architecture
- [[Backend-Architecture]]
- [[routes-index]]
- [[providers-index]]

### Backend — routes
- [[auth.routes]]
- [[document.routes]]
- [[chat.routes]]
- [[command.routes]]

### Backend — controllers
- [[auth.controller]]
- [[document.controller]]
- [[chat.controller]]
- [[command.controller]]

### Backend — Prisma models
- [[Model-User]]
- [[Model-Session]]
- [[Model-VerificationToken]]
- [[Model-Document]]
- [[Model-Chunk]]
- [[Model-Message]]
- [[Model-AIArtifact]]

### Backend — repositories
- [[document.repository]]
- [[chunk.repository]]
- [[message.repository]]
- [[ai-artifact.repository]]
(user/session/verification-token repositories are covered inline in [[Auth-System]]/[[auth.service]] rather than as separate notes — thin Prisma passthroughs)

### Backend — services
- [[auth.service]]
- [[email.service]]
- [[b2-storage.service]]
- [[document.service]]
- [[chat.service]]
- [[command.service]]
- [[processing.service]]
- [[pinecone.service]]
- [[ai.service]]

### Backend — middleware
- [[guest-session.middleware]]
- [[auth.middleware]]
- [[csrf.middleware]]
- [[error-handler]]
- [[rate-limiter]]
- [[upload]]
- [[validation]]

### Backend — worker & AI layer
- [[processor]]
- [[templates]]
- [[gemini.provider]]

## Source
Whole-repo read of `client/src/**` and `server/src/**`, `server/prisma/schema.prisma`, `server/.env.example`, `client/package.json`, `server/package.json`, `README.md`, plus the enterprise-auth/guest-mode/SEO overhaul applied on top. Excludes `client/src/components/ui/*` (vendored shadcn/ui primitives — covered as a list in [[Frontend-Architecture]]), and all `.env`/`dev.db`/`uploads/` real data per the documentation brief.

## Dependencies
N/A (root index).

## Related
Every note above.

## Notes
This vault reflects the code after the enterprise-auth + guest-mode + DB-backed-recents + SEO overhaul (git history up through `main` as of this pass). Three things a fresh agent should internalize immediately: (1) auth is now real — email/password + JWT + rotating refresh tokens + a signed guest-session cookie, not a client-trusted `clientId` — start at [[Auth-System]]; (2) every document/chat/command endpoint is ownership-checked against `req.owner` now — the old tenant-scoping gaps documented historically in [[Known-Issues-and-Conventions]] are closed; (3) "recent documents" is server-tracked (`Document.lastAccessedAt`), not `localStorage`, and the original PDF *can* be persisted server-side via Backblaze B2 (`b2-storage.service`), though the viewer still reads from IndexedDB first — see [[Known-Issues-and-Conventions]] for the exact boundary of what's wired up vs. not. The root `README.md` is still aspirational/marketing copy and diverges from the actual API surface and env var names in places — trust this vault (built from source) over it.
