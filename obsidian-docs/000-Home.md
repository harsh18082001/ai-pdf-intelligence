---
tags: [home]
---
## Purpose
Master index for the DocIQ (`ai-pdf-intelligence`) codebase vault — an AI-PDF RAG platform. Start here.

## Tech Stack
**Frontend** (`client/`): React 19, Vite, TypeScript, Redux Toolkit + RTK Query, react-router-dom v7, Supabase JS client (installed, **unused** — see [[lib-supabase]]), react-pdf, Tailwind v4, shadcn/radix-ui, `idb` (IndexedDB), react-markdown, self-hosted variable fonts (`@fontsource-variable/inter` + `@fontsource-variable/fraunces`), `framer-motion` (route/UI motion), `cmdk` (command palette), `react-resizable-panels` (pinned to v2 — see [[Dependencies]]), `tw-animate-css` (backs the dialog/menu animate-in/out classes) — see [[Frontend-Architecture#Design system — "Glacier" (`index.css`)]] and [[Frontend-Architecture#App shell — sidebar navigation, not a top header (redesign pass)]].

**Backend** (`server/`): Express 5, Prisma ORM → PostgreSQL (Supabase-hosted), Google Gemini (`@google/generative-ai`) for LLM inference, Pinecone (vector DB) for embeddings/retrieval, `unpdf` for PDF text extraction, zod for validation, pino for logging, express-fileupload, helmet, express-rate-limit.

**Auth**: an anonymous `clientId` UUID generated client-side and stored in `localStorage`, sent as an `x-client-id` header — see [[AuthContext]]. **Not** Supabase session auth, despite the Supabase JS client being installed.

## Folder Structure
```
ai-pdf-intelligence/
├── client/src/
│   ├── api/            → baseApi, chatApi, commandApi, documentApi
│   ├── components/
│   │   ├── chat/       → ChatInput, ChatInterface, ChatMessage
│   │   ├── documents/  → DocumentCard, DocumentHeader, DocumentList, DocumentStatusBadge, DocumentToolbar, PDFViewer, UploadDropzone, UploadModal (MetadataPanel retired/deleted)
│   │   ├── layout/     → AppSidebar, TopBar, MobileSidebarSheet, PageTransition, Layout (Header, PageHeader retired/deleted)
│   │   ├── command-palette.tsx
│   │   ├── theme-provider.tsx
│   │   └── ui/         → shadcn/ui primitives (not individually documented, except EmptyState — see Frontend-Architecture)
│   ├── context/        → AuthContext
│   ├── hooks/          → useChat, useMediaQuery, useRecentDocuments
│   ├── lib/            → supabase (unused), user (unused), utils, document-status, recent-documents
│   ├── pages/          → HomePage, DocumentPage
│   ├── services/       → pdfStorage
│   ├── store/          → store, hooks
│   └── types/          → shared DTOs
├── server/src/
│   ├── ai/             → ai.service, ai.types, prompts/templates, providers/gemini.provider, providers/index
│   ├── config/         → constants, env
│   ├── controllers/     → document, chat, command
│   ├── middlewares/    → error-handler, rate-limiter, upload, validation
│   ├── repositories/   → document, chunk, message, ai-artifact
│   ├── routes/         → index, document, chat, command
│   ├── services/       → document, chat, command, processing, pinecone
│   ├── utils/          → async-handler, chunker, logger
│   ├── workers/        → processor
│   ├── app.ts, index.ts, db.ts
│   └── prisma/schema.prisma → Document, Chunk, Message, AIArtifact
└── obsidian-docs/      → this vault
```

## Start here for...

- **A chat bug** → [[useChat]] → [[ChatInterface]] → [[chat.controller]] → [[chat.service]] → [[templates]] → [[Data-Flow#2. Chat message flow]]
- **An upload/processing bug** → [[UploadModal]] → [[document.controller]] → [[document.service]] → [[processor]] → [[processing.service]] → [[Data-Flow#1. Upload flow]]
- **A "summary/insights/key points" bug** → [[DocumentHeader]] (Actions dropdown) → [[command.controller]] → [[command.service]] → [[templates]] → [[Data-Flow#5. Command flow]]
- **A document list/view bug** → [[DocumentList]] / [[DocumentPage]] → [[documentApi]] → [[document.routes]] → [[document.repository]] → [[Model-Document]]
- **A navigation/sidebar/filter bug** → [[AppSidebar]] (status nav + counts + recent) → [[HomePage]] (URL-synced filter state) → [[DocumentToolbar]] / [[command-palette]]
- **A PDF preview/rendering bug** → [[PDFViewer]] → [[pdfStorage]] (client-only, no server endpoint — see [[Known-Issues-and-Conventions]])
- **An auth/identity question** → [[AuthContext]] → [[baseApi]] → backend `getClientId()` in [[document.controller]]/[[chat.controller]] → [[Data-Flow#4. Auth / identity flow]] (and read [[Known-Issues-and-Conventions]] before assuming Supabase auth exists)
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

### Frontend architecture
- [[Frontend-Architecture]]
- [[App-tsx]]
- [[store]]
- [[store-hooks]]
- [[lib-utils]]

### Frontend — pages
- [[HomePage]]
- [[DocumentPage]]

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
- [[Header]] (retired)
- [[PageHeader]] (retired)
- [[MetadataPanel]] (retired)

### Frontend — hooks, API services, context/lib/services/store
- [[useChat]]
- [[baseApi]]
- [[chatApi]]
- [[commandApi]]
- [[documentApi]]
- [[AuthContext]]
- [[lib-supabase]]
- [[lib-user]]
- [[document-status]]
- [[recent-documents]]
- [[useMediaQuery]]
- [[useRecentDocuments]]
- [[pdfStorage]]

### Backend architecture
- [[Backend-Architecture]]
- [[routes-index]]
- [[providers-index]]

### Backend — routes
- [[document.routes]]
- [[chat.routes]]
- [[command.routes]]

### Backend — controllers
- [[document.controller]]
- [[chat.controller]]
- [[command.controller]]

### Backend — Prisma models
- [[Model-Document]]
- [[Model-Chunk]]
- [[Model-Message]]
- [[Model-AIArtifact]]

### Backend — repositories
- [[document.repository]]
- [[chunk.repository]]
- [[message.repository]]
- [[ai-artifact.repository]]

### Backend — services
- [[document.service]]
- [[chat.service]]
- [[command.service]]
- [[processing.service]]
- [[pinecone.service]]
- [[ai.service]]

### Backend — middleware
- [[error-handler]]
- [[rate-limiter]]
- [[upload]]
- [[validation]]

### Backend — worker & AI layer
- [[processor]]
- [[templates]]
- [[gemini.provider]]

## Source
Whole-repo read of `client/src/**` and `server/src/**`, `server/prisma/schema.prisma`, `server/.env.example`, `client/package.json`, `server/package.json`, `README.md`. Excludes `client/src/components/ui/*` (vendored shadcn/ui primitives — covered as a list in [[Frontend-Architecture]]), and all `.env`/`dev.db`/`uploads/` real data per the documentation brief.

## Dependencies
N/A (root index).

## Related
Every note above.

## Notes
This vault reflects the code as of the read that generated it (see git log: `b3766e8`, `065aa1b`, `2d1da58`, `c59f93e`, `47d92bf` on `main`). Two things a fresh agent should internalize immediately: (1) auth is an anonymous `clientId`, not Supabase session auth — [[AuthContext]]; (2) tenant scoping is inconsistent — chat history reads and all command execution are **not** ownership-checked — [[Known-Issues-and-Conventions]]. The root `README.md` is aspirational/marketing copy and diverges from the actual API surface and env var names in places — trust this vault (built from source) over it.
