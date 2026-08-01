# DocIQ — AI-Powered PDF Intelligence & RAG Platform

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-ai--pdf--intelligence.vercel.app-success?style=for-the-badge&logo=vercel)](https://ai-pdf-intelligence.vercel.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express 5](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma_6-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Pinecone](https://img.shields.io/badge/Pinecone_Vector_DB-000000?style=for-the-badge&logo=pinecone&logoColor=white)](https://www.pinecone.io/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini_AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Node.js](https://img.shields.io/badge/Node.js_22+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

**DocIQ** is a full-stack **Retrieval-Augmented Generation (RAG)** platform that turns static PDFs into interactive knowledge bases — contextual chat with token streaming, semantic vector search, and one-click AI artifacts (summary, key points, insights).

> **Independent project** — designed and built end-to-end as a production-oriented demonstration of modern full-stack + AI systems engineering.

[🚀 **Try the Live Application**](https://ai-pdf-intelligence.vercel.app/)

---

## Table of Contents

- [Why DocIQ](#-why-dociq)
- [System Architecture](#-system-architecture)
- [Core Capabilities](#-core-capabilities)
- [End-to-End Flows](#-end-to-end-flows)
- [Data & Vector Model](#-data--vector-model)
- [API Reference](#-api-reference)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Local Setup](#-local-setup)
- [Security & Performance](#-security--performance)
- [Design Decisions](#-design-decisions)
- [Engineering Highlights](#-engineering-highlights)

---

## 🎯 Why DocIQ

Manual PDF review does not scale. DocIQ closes that gap with a **decoupled monorepo**: a React 19 client and an Express 5 API that own ingestion, embeddings, retrieval, and generation as first-class pipelines — not a thin wrapper around a single LLM call.

| Pillar | What it means in this codebase |
| :----- | :----------------------------- |
| **Production-style RAG** | Token-aware chunking (~512 / 50 overlap) → embeddings → Pinecone cosine retrieval (top-K = 5) → grounded Gemini answers |
| **Real-time streaming** | Server-Sent Events (SSE) + async generators for token-by-token chat |
| **Resilient LLM layer** | Multi-model fallback chain on 429 / 503 / 404 |
| **Multi-tier caching** | Browser IndexedDB (PDF bytes) + RTK Query (API) + PostgreSQL AI artifacts (avoid repeat LLM cost) |
| **Client isolation** | Anonymous `clientId` on documents + Pinecone namespaces for vector partition |

---

## 🏗️ System Architecture

High-level view of client, API gateway, domain services, storage, and AI providers:

```mermaid
graph TB
    subgraph Client ["🖥️ Client — React 19 + Vite + Redux Toolkit"]
        UI["UI Shell<br/>Sidebar · Command Palette · Document Workspace"]
        IDB[("IndexedDB<br/>Local PDF blob cache")]
        RTK["RTK Query<br/>Document / Message / Artifact cache"]
        CHAT["useChat · EventSource SSE"]
    end

    subgraph Gateway ["🛡️ Express 5 API Gateway"]
        CORS["CORS + Helmet"]
        RL["Rate limits<br/>100/15min · AI 20/min"]
        VAL["Zod validation · PDF upload"]
        ERR["Central AppError handler"]
    end

    subgraph Domain ["⚙️ Domain Services"]
        DS["Document Service"]
        PS["Processing Service<br/>extract · chunk · embed"]
        CS["Chat Service — RAG"]
        CMD["Command Service — Artifacts"]
        REPO["Repository layer · Prisma"]
    end

    subgraph Storage ["💾 Persistence"]
        PG[("PostgreSQL<br/>Documents · Chunks · Messages · Artifacts")]
        PC[("Pinecone index: dociq<br/>~768-dim · clientId namespaces")]
    end

    subgraph AI ["🤖 AI Layer"]
        GEM["Google Gemini<br/>Chat + streaming"]
        EMB["Embedding model<br/>batch + single"]
        FB["Failover models<br/>on 429/503/404"]
    end

    UI <--> IDB
    UI <--> RTK
    CHAT --> CORS
    RTK --> CORS
    CORS --> RL --> VAL --> ERR
    VAL --> DS & CS & CMD
    DS --> PS
    PS --> EMB --> GEM
    PS --> PC
    PS --> REPO --> PG
    CS --> EMB
    CS --> PC
    CS --> GEM
    CS --> FB
    CS --> REPO
    CMD --> REPO
    CMD --> GEM
    CMD --> FB
```

### Request lifecycle (server)

```mermaid
sequenceDiagram
    participant C as Client
    participant MW as Middleware stack
    participant R as Routes / Controllers
    participant S as Services
    participant DB as Postgres + Pinecone
    participant AI as Gemini

    C->>MW: HTTP / SSE request + x-client-id
    MW->>MW: CORS → Helmet → JSON/file → Rate limit
    MW->>R: /api/*
    R->>S: Validated DTO + clientId
    alt Upload / process
        S->>DB: Create document, chunks, vectors
        S->>AI: Embeddings
    else Chat stream
        S->>AI: Query embedding
        S->>DB: Top-K similarity
        S->>AI: Stream completion
        S-->>C: SSE tokens → [DONE]
    else Command
        S->>DB: Artifact cache hit/miss
        S->>AI: Generate if miss
    end
    S-->>R: DTO / stream
    R-->>C: ApiResponse or SSE
```

---

## ✨ Core Capabilities

| Capability | Implementation | Why it matters |
| :--------- | :------------- | :------------- |
| **PDF ingestion pipeline** | `unpdf` text extract → OCR gate (&lt;50 chars → `ocr_required`) → chunk → embed → Postgres + Pinecone | Full path from file to searchable knowledge |
| **Semantic RAG chat** | Query embed → Pinecone filter by `documentId` + namespace → top-K 5 → prompt with last 6 turns | Grounded answers without dumping the whole PDF into the context window |
| **Token streaming UI** | `GET .../chat/stream` via `EventSource` + optimistic local messages | Low time-to-first-token chat experience |
| **One-click AI actions** | Summary / key points / insights with Postgres `ai_artifacts` upsert cache | Repeat clicks are free after first generation |
| **Zero-network PDF viewer** | Raw file stored in IndexedDB at upload; `react-pdf` renders client-side | Instant side-by-side preview without a download API |
| **LLM failover** | Primary chat model → `gemini-3.5-flash` → `gemma-4-26b-a4b-it` → `gemini-flash-lite-latest` | Degrades gracefully under rate limits and model outages |
| **App shell UX** | Collapsible sidebar, `⌘K` command palette, URL-synced filters, resizable chat/PDF panes | Product-quality navigation, not a single-page demo form |

---

## 🔄 End-to-End Flows

### 1. Document ingestion & vector indexing

Upload runs **synchronously in the request** (intentional for serverless — see [Design Decisions](#-design-decisions)). The response returns only after processing finishes (`completed` / `failed` / `ocr_required`).

```mermaid
flowchart LR
    A["📄 Upload PDF"] --> B["Validate MIME + size<br/>express-fileupload"]
    B --> C["Create Document<br/>status: pending"]
    C --> D["Extract text · unpdf"]
    D --> E{"Text length ≥ 50?"}
    E -- No --> F["status: ocr_required"]
    E -- Yes --> G["Chunk ~512 tokens<br/>50-token overlap"]
    G --> H["Batch embed via Gemini"]
    H --> I["Persist Chunk rows<br/>PostgreSQL"]
    H --> J["Upsert vectors<br/>Pinecone · clientId ns"]
    I --> K["status: completed"]
    J --> K
    K --> L["Client saves File<br/>to IndexedDB"]
```

### 2. Contextual RAG chat + SSE streaming

```mermaid
flowchart LR
    A["💬 User message"] --> B["Save user Message"]
    B --> C["Embed question"]
    C --> D["Pinecone top-K=5<br/>documentId filter"]
    D --> E["Build QA prompt<br/>context + last 6 turns"]
    E --> F["Gemini stream"]
    F --> G["SSE data chunks"]
    G --> H["Save assistant Message"]
    H --> I["Client: [DONE]<br/>invalidate Message tag"]
```

### 3. AI command execution & artifact cache

```mermaid
flowchart LR
    A["⚡ Actions menu<br/>summary · key_points · insights"] --> B{"Artifact cached<br/>docId + type?"}
    B -- Hit --> C["Return instantly<br/>no LLM call"]
    B -- Miss --> D["Load all chunks"]
    D --> E["Typed prompt template"]
    E --> F["Gemini completion"]
    F --> G["Upsert ai_artifacts"]
    G --> H["Render Markdown dialog"]
```

### 4. Multi-model resilience

```mermaid
flowchart LR
    A["AI generation request"] --> B["Primary<br/>GEMINI_CHAT_MODEL"]
    B -- OK --> Z["Return / stream"]
    B -- 429 / 503 / 404 --> C["Fallback 1<br/>gemini-3.5-flash"]
    C -- OK --> Z
    C -- fail --> D["Fallback 2<br/>gemma-4-26b-a4b-it"]
    D -- OK --> Z
    D -- fail --> E["Fallback 3<br/>gemini-flash-lite-latest"]
    E -- OK --> Z
    E -- fail --> F["AppError to client"]
```

### 5. Identity & multi-tier cache

```mermaid
flowchart TB
    subgraph Identity
        LS["localStorage dociq_client_id"] --> H["x-client-id header<br/>RTK Query"]
        LS --> Q["clientId query<br/>EventSource stream"]
    end

    subgraph Caches
        C1["IndexedDB<br/>PDF binary by documentId"]
        C2["RTK Query tags<br/>Document · Message · AIArtifact"]
        C3["Postgres ai_artifacts<br/>unique documentId + type"]
    end

    H --> API["API ownership checks<br/>on list / get / delete / stream"]
    Q --> API
    C1 --> PDF["PDFViewer"]
    C2 --> UI["Lists · chat history"]
    C3 --> CMD["Commands"]
```

---

## 🗄️ Data & Vector Model

### Entity-relationship diagram

```mermaid
erDiagram
    Document ||--o{ Chunk : contains
    Document ||--o{ Message : has
    Document ||--o{ AIArtifact : caches

    Document {
        Int id PK
        String title
        String fileName
        Int fileSize
        Int pageCount
        String status
        String errorMsg
        String clientId
        DateTime createdAt
        DateTime updatedAt
    }

    Chunk {
        Int id PK
        Int documentId FK
        Int chunkIndex
        String text
        Int tokenCount
    }

    Message {
        Int id PK
        Int documentId FK
        String role
        String content
        DateTime createdAt
    }

    AIArtifact {
        Int id PK
        Int documentId FK
        String type
        String content
        DateTime createdAt
        DateTime updatedAt
    }
```

**Document status machine:** `pending` → `processing` → `completed` | `failed` | `ocr_required`

### Pinecone layout

| Setting | Value |
| :------ | :---- |
| Index name | `dociq` (hard-coded in service) |
| Typical dimension | ~768 (aligned with Gemini embedding output; index stats used on delete) |
| Similarity | Cosine |
| Vector ID | `doc_{documentId}_chunk_{chunkIndex}` |
| Isolation | `index.namespace(clientId)` when `clientId` is present |
| Query filter | `documentId` equality + top-K (default **5**) |

---

## 🔌 API Reference

Base path: **`/api`**.  
Envelope (JSON endpoints):

```ts
{ success: boolean; data?: T; error?: string; message?: string; details?: unknown }
```

Identity is optional/required per route via header **`x-client-id`** (also accepted as `clientId` query/body). There is no password/session auth — this is a portfolio-friendly anonymous client model.

### Documents — `/api/documents`

| Method | Path | Auth | Description |
| :----- | :--- | :--- | :---------- |
| `POST` | `/api/documents` | `clientId` attached if present | Upload PDF (`multipart`, field `file`). Runs full processing before `201` |
| `GET` | `/api/documents` | Required for non-empty list | List documents for caller (`[]` if no `clientId`) |
| `GET` | `/api/documents/:id` | If `clientId` set, must match | Document metadata |
| `DELETE` | `/api/documents/:id` | Same ownership rule | Deletes Postgres row (cascade) + Pinecone vectors |

### Chat — `/api/documents/:documentId/chat`

AI routes also use **`aiLimiter`** (20 req/min/IP) on top of the global limiter.

| Method | Path | Auth | Description |
| :----- | :--- | :--- | :---------- |
| `GET` | `/api/documents/:documentId/chat` | Document must exist | Message history (ascending) |
| `POST` | `/api/documents/:documentId/chat` | Ownership enforced | Non-streaming completion `{ message }` — implemented; **UI uses stream** |
| `GET` | `/api/documents/:documentId/chat/stream` | Ownership enforced | **SSE stream** — query: `message`, optional `clientId` |

**SSE contract:** `data: "<token chunk>"` events, then `data: [DONE]`. Errors: `data: {"error":"..."}`.

### Commands — `/api/commands`

| Method | Path | Body | Description |
| :----- | :--- | :--- | :---------- |
| `POST` | `/api/commands` | `{ documentId, command, regenerate? }` | Generate or return cached artifact |

**Primary UI commands:** `summary` | `key_points` | `insights`  
(Schema also accepts additional types for future expansion.)

---

## 🛠️ Tech Stack

| Layer | Technology | Role in DocIQ |
| :---- | :--------- | :------------ |
| Frontend | React 19, TypeScript, Vite 8 | App UI + routing |
| State / data | Redux Toolkit, RTK Query | Server-state cache & invalidation |
| Styling | Tailwind CSS v4, Radix / shadcn, Framer Motion | “Glacier” design system + motion |
| PDF UI | react-pdf, idb | Canvas render + local binary cache |
| Backend | Node 22+, Express 5 | REST + SSE API |
| ORM / DB | Prisma 6, PostgreSQL (e.g. Supabase) | Relational source of truth |
| Vectors | Pinecone | Semantic retrieval |
| LLM | `@google/generative-ai` (Gemini) | Chat, stream, embeddings |
| Extraction | unpdf | Server-side PDF text |
| Validation / ops | Zod, Helmet, express-rate-limit, Pino | Contracts, security headers, limits, logs |
| Deploy | Vercel (client SPA + serverless API, `maxDuration` 60s) | Live demo hosting |

---

## 📁 Repository Structure

```
ai-pdf-intelligence/
├── client/                         # React 19 workspace
│   ├── src/
│   │   ├── api/                    # RTK Query: baseApi, document, chat, command
│   │   ├── components/
│   │   │   ├── chat/               # ChatInterface, ChatInput, ChatMessage
│   │   │   ├── documents/          # Cards, toolbar, PDFViewer, upload, DocumentHeader
│   │   │   ├── layout/             # AppSidebar, TopBar, Layout, PageTransition, mobile sheet
│   │   │   ├── command-palette.tsx # ⌘K navigation
│   │   │   ├── theme-provider.tsx
│   │   │   └── ui/                 # shadcn/Radix primitives
│   │   ├── context/                # AuthContext (clientId)
│   │   ├── hooks/                  # useChat, useMediaQuery, useRecentDocuments
│   │   ├── pages/                  # HomePage, DocumentPage
│   │   ├── services/               # pdfStorage (IndexedDB)
│   │   ├── store/                  # Redux store + typed hooks
│   │   └── types/
│   ├── vite.config.ts              # Dev proxy /api → :3001
│   └── package.json
│
├── server/                         # Express 5 workspace
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── ai/                     # AI service, Gemini provider, prompt templates
│   │   ├── controllers/            # document, chat, command
│   │   ├── middlewares/            # upload, validation, rate-limit, errors
│   │   ├── repositories/           # Prisma data access only
│   │   ├── routes/
│   │   ├── services/               # document, processing, chat, command, pinecone
│   │   ├── workers/processor.ts    # In-process processing entry (not a job queue)
│   │   ├── utils/                  # chunker, logger, async-handler
│   │   ├── app.ts
│   │   └── index.ts
│   └── package.json
│
├── package.json                    # npm workspaces root
└── README.md
```

---

## ⚡ Local Setup

### Prerequisites

- **Node.js** ≥ 22  
- **npm** ≥ 10  
- **PostgreSQL** (local or hosted — Supabase/Neon work well)  
- [Pinecone](https://www.pinecone.io/) API key + index named **`dociq`**  
- [Google AI Studio](https://aistudio.google.com/) Gemini API key  

### 1. Clone & install

```bash
git clone https://github.com/harsh18082001/ai-pdf-intelligence.git
cd ai-pdf-intelligence
npm install
```

### 2. Backend environment (`server/.env`)

```bash
cp server/.env.example server/.env
```

```env
PORT=3001
NODE_ENV=development

# PostgreSQL
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public"

# Google Gemini
GEMINI_API_KEY="your_gemini_api_key"
# Optional overrides (defaults exist in code):
# GEMINI_CHAT_MODEL=gemini-flash-latest
# GEMINI_EMBEDDING_MODEL=gemini-embedding-2

# Pinecone
PINECONE_API_KEY="your_pinecone_api_key"
PINECONE_INDEX_HOST="https://your-index-host.pinecone.io"

# Optional
MAX_FILE_SIZE_MB=50
LOG_LEVEL=info
```

### 3. Frontend environment (`client/.env`) — optional in local dev

Vite proxies `/api` → `http://localhost:3001`, so the default base URL works without a file:

```env
# Optional — defaults to "/api"
VITE_API_URL=/api
```

> Use an absolute URL (e.g. `http://localhost:3001/api`) only if you bypass the Vite proxy.

### 4. Database

```bash
cd server
npx prisma migrate dev --name init
npx prisma generate
cd ..
```

### 5. Run

```bash
npm run dev
```

| Process | URL |
| :------ | :-- |
| Client | http://localhost:5173 |
| API | http://localhost:3001 |

```bash
npm run lint
npm run build
```

---

## 🛡️ Security & Performance

```mermaid
mindmap
  root((DocIQ hardening))
    Gateway
      Helmet headers
      CORS credentials
      Global rate limit 100 / 15 min
      AI rate limit 20 / min
      Max upload 50 MB PDF-only
    Data isolation
      clientId on documents
      Pinecone namespaces
      Ownership checks on mutate / stream
    Cost & latency
      Top-K retrieval not full-doc prompts
      Artifact cache in Postgres
      RTK tag invalidation
      IndexedDB PDF cache
    Reliability
      Zod env + request validation
      Central error middleware
      LLM multi-model fallback
      Graceful SIGTERM/SIGINT shutdown
```

1. **Context discipline** — Chat sends only top-K chunks + short history, not the entire document.  
2. **Cache layers** — Artifacts and RTK tags cut repeat network/LLM work; IndexedDB avoids re-shipping PDFs on the same device.  
3. **Upload size & type gates** — PDF-only middleware + configurable MB cap.  
4. **Structured errors** — Operational `AppError` / Zod / upload errors map to a consistent JSON shape (SSE path handles errors in-band).

---

## 🧠 Design Decisions

| Decision | Rationale |
| :------- | :-------- |
| **Sync processing on upload** | Serverless functions die after the response; awaiting the pipeline keeps indexing reliable on Vercel (`maxDuration` 60s) without a separate worker. |
| **No server PDF binary store** | Extracted text + vectors are enough for AI; raw bytes stay in the browser for preview (re-attach if opened on another device). |
| **Anonymous `clientId`** | Zero-friction demo identity; documents scoped for list/get/delete/stream without full OAuth for a public portfolio deploy. |
| **SSE over WebSockets** | One-way token stream fits chat generation; works cleanly with `EventSource` and HTTP edge deploy. |
| **Repository boundary** | Only repositories touch Prisma; services stay testable and free of query sprawl. |
| **Pinned `react-resizable-panels` v2** | shadcn resizable recipe targets the classic API; v4 is a breaking rewrite. |

---

## 👨‍💻 Engineering Highlights

Skills this project is meant to demonstrate in a hiring context:

1. **End-to-end RAG systems** — chunking, embeddings, vector filters, prompt assembly, grounded generation.  
2. **Full-stack TypeScript** — shared DTO mindset, Express 5 API, React 19 UI, Prisma schema design.  
3. **Streaming UX** — SSE + optimistic UI + cache invalidation after persistence.  
4. **Resilience** — provider failover, rate limits, validated config, graceful shutdown.  
5. **Product polish** — command palette, sidebar shell, status model, Markdown AI output, dark/light theme.  
6. **Deploy awareness** — monorepo workspaces, Vite proxy, Vercel SPA + serverless API constraints.

---

## 📜 License

MIT — feel free to fork for learning. If you ship a derivative, attribution is appreciated.

---

<p align="center">
  <b>DocIQ</b> — from PDF bytes to grounded answers.<br/>
  Built as a portfolio-grade full-stack + AI systems project.
</p>
