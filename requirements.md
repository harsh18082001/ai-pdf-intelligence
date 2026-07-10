# Executive Summary  
We propose building **DocIQ**, an AI-powered PDF intelligence platform that lets users upload documents and interact with them via chat/Q&A. The system uses a **Node.js**/Express backend with **SQLite + Prisma** for storage (no user auth in MVP) and the **Hugging Face Inference API** for AI tasks. PDFs are parsed (via the `unpdf` library), chunked, embedded, and cached. Questions trigger retrieval of the most relevant chunks (using an SQLite-vector extension for fast vector search), then call a chat model (e.g. Llama-3) to answer. A React+TypeScript frontend (Vite + Redux Toolkit/RTK Query) provides a file upload UI, PDF preview, and a streaming chat interface. Heavy tasks (text extraction, chunking, embedding) run in background jobs with BullMQ. The app is containerized (Docker), with CI/CD via GitHub Actions and free hosting (Vercel frontend, Render/Railway backend). Key features (MVP) include PDF upload, chat/Q&A, chat history, and PDF summaries; advanced features (Phase 2) will add resume parsing, flashcards, and MCQ generation.  

## MVP Features & User Flows  
- **Upload PDF:** User drags/drops or selects a PDF. Backend saves file, enqueues processing job.  
- **Document Processing:** A worker extracts text (with `unpdf`/PDF.js), segments it into chunks (~400–800 tokens with overlap), computes embeddings (via Hugging Face `featureExtraction` API), and stores text+embeddings in SQLite.  
- **Chat/Q&A Interface:** User selects a document and asks a question. Frontend sends the query to the backend. The backend retrieves top-k relevant chunks (via cosine similarity lookup in the vector store), then calls an HF chat-completion model with a prompt combining context and question. Answer is streamed back to the UI.  
- **Chat History:** Q&A pairs are stored (in SQLite) and displayed. Users can revisit previous chats for a document.  
- **Additional Actions (MVP):** “Summarize Document”, “Generate Key Points” and “Extract Insights” buttons that send the entire document (or a summary of chunks) to the LLM for overview.  

## Tech Stack & Libraries  

| Layer           | Technology / Library        | Purpose                                 |
| --------------- | -------------------------- | --------------------------------------- |
| **Frontend**    | React, TypeScript          | UI components and logic                 |
|                 | Vite                       | Build tool                             |
|                 | Redux Toolkit + RTK Query  | State management & data fetching        |
|                 | CSS-in-JS / Tailwind / shadcn/ui | Styling library                    |
|                 | WS / SSE                   | Streaming API for chat (see below)      |
| **Backend**     | Node.js + Express          | HTTP API server                         |
|                 | Prisma ORM + SQLite        | Data modeling and access (file-based DB) |
|                 | `unpdf` (PDF.js wrapper)   | PDF text extraction       |
|                 | `@huggingface/inference`   | HF Inference API client (chat, embeddings) |
|                 | BullMQ + Redis             | Background job queue                    |
|                 | Redis Cache                | Caching QAs / embeddings (optional)     |
|                 | Node worker threads / Bull | Parsing & embedding in background       |
| **AI Models**   | LLM (e.g. Llama-3.1, Mistral) | Document QA / chat                     |
|                 | Embedding model (e.g. all-MiniLM-L6-v2) | Text embeddings                   |
|                 | OCR model (e.g. TrOCR, OlmOCR) | Fallback for scanned PDFs (Vision API) |
| **Vector Store**| SQLite + SQLite-Vector ext. | Embedding vectors and similarity search |
| **Deployment**  | Docker, GitHub Actions     | Container builds & CI/CD                |
|                 | Vercel (frontend), Render/Railway (backend) | Cloud hosting (free tiers) |
|                 | Environment Vars (`.env`)  | API keys, DB path, etc.                 |
| **Monitoring**  | Pino / Winston logging     | Structured logs                          |
|                 | Sentry (optional)          | Error reporting                         |
| **Testing**     | Jest                       | Unit/integration tests                  |
|                 | Supertest                  | API endpoint testing                    |
|                 | Playwright / Cypress       | End-to-end UI tests                     |

_Source:_ We select well-known, actively maintained libraries (unpdf for PDF.js-based extraction, `@huggingface/inference` for AI calls, Prisma+SQLite for zero-setup DB) to ensure an easily deployable stack. 

## Database Schema (Prisma models)  
Use SQLite as a simple file (`dev.db`). Example Prisma models:  

```prisma
model Document {
  id        Int      @id @default(autoincrement())
  title     String
  filePath  String
  text      String   // full extracted text (optional)
  createdAt DateTime @default(now())
  chunks    Chunk[]
  messages  Message[]
}

model Chunk {
  id          Int      @id @default(autoincrement())
  document    Document @relation(fields: [documentId], references: [id])
  documentId  Int
  text        String    // text of chunk
  embedding   Bytes?    // stored as BLOB via sqlite-vector
  createdAt   DateTime  @default(now())
}

model Message {
  id          Int      @id @default(autoincrement())
  document    Document @relation(fields: [documentId], references: [id])
  documentId  Int
  role        String   // "user" or "assistant"
  content     String
  createdAt   DateTime @default(now())
}
```

- **Document:** Meta-info and full text.  
- **Chunk:** Pieces of text from the PDF. `embedding` stored as BLOB (float32 array) via SQLite-Vector extension.  
- **Message:** Chat history entries.  

When using Prisma, set `provider = "sqlite"` and `url = "file:./dev.db"`. The `embedding` field can use `Bytes` type; we’ll use the SQLite-Vector functions to handle it (see RAG section).  

## Backend API Design  

We use Express with JSON. **No auth** in MVP. Rate-limit endpoints modestly (e.g. 60/min) to avoid abuse. Stream chat responses via HTTP SSE or WebSocket. Example endpoints:

| Method | Endpoint                | Request Body                            | Response                                           | Description                                  |
| ------ | ----------------------- | --------------------------------------- | -------------------------------------------------- | -------------------------------------------- |
| `POST /api/documents` | `{ file: PDF }` (multipart)         | 201 Created `{ id, title }`                     | Uploads PDF, returns document ID.               |
| `GET /api/documents`  | —                                     | 200 OK `[ {id,title,createdAt} ]`               | List uploaded docs.                             |
| `GET /api/documents/:id` | —                                 | 200 OK `{ id, title, text? }`                   | Get document details (title, etc).              |
| `DELETE /api/documents/:id` | —                              | 204 No Content                                  | Delete document and its data.                   |
| `POST /api/chat/:id`  | `{ message: string }`                | 202 Accepted `{ chatId }` (optionally)          | Queue user message for doc, returns chatID.     |
| `GET /api/chat/:id/stream` | —                               | *Streaming response (text/event-stream)*        | Streams answer chunks (SSE).      |
| `GET /api/chats/:id/history` | —                              | 200 OK `[ {role,content,createdAt}, ... ]`      | Retrieve chat history for document.             |
| `POST /api/commands`  | `{ docId, command }` (e.g. command="summarize") | 200 OK `{ result }`                        | Trigger actions like summary, flashcards etc.   |
  
**Error handling:** Return standard HTTP codes. On AI errors, return 502 Bad Gateway with message. Rate-limit with middleware (e.g. `express-rate-limit`). Use try/catch in async routes, log errors, and send generic failures.

## AI Integration Layer  

- **Models (Hugging Face Inference API):**  
  - **Chat/QA:** Use an open LLM (e.g. `meta-llama/Llama-3.1-8B-Instruct` or `mistralai/Mistral-7B`) via Inference API. These have ~16k token context. Providers: default HF.  
  - **Embeddings:** Use a sentence-transformer (e.g. `"sentence-transformers/all-MiniLM-L6-v2"`) via HF `featureExtraction`.  
  - **OCR (if needed):** If extracted text is empty (scanned PDF), use a vision-language OCR model (e.g. `microsoft/trocr-small-handwritten` or `togethercomputer/OlmOCR-2`) via HF.  

- **Prompt Templates:**  
  - **System prompt:** “You are a helpful assistant answering questions based on the user's PDF content.” Append retrieved chunks as context (with separators) before the user question. For example:
    ```
    System: You are an assistant. Use only the provided document excerpts to answer.
    Context: "...<chunk1>...<chunkN>..."
    User: <question>
    ```
  - For summarization: prompt with “Summarize the following document...” and supply full text or all chunks.
  - For flexibility, implement simple Jinja-like templates using [@huggingface/jinja] to format messages.

- **Batching & Limits:**  
  - Stay within token limits (~8k input for safety). If a query with retrieved context would exceed the model’s max tokens, truncate older chunks.  
  - Hugging Face free tier has rate limits (~5 requests/min for large models). Mitigation: cache embeddings and chunk retrieval, queue queries, and optionally switch to a smaller model (e.g. GPT-2) for brief answers.  

- **Local Model Fallback:**  
  - For offline or heavy use, plan to allow a local model server (e.g. Ollama or Transformers.js). The HF InferenceClient can be pointed at a local endpoint if available.  
  - Alternatively, Transformers.js can run local models in Node (e.g. run quantized LLaMA locally), avoiding API calls.

- **Streaming Support:**  
  - Use HF client’s `chatCompletionStream` to get partial outputs. Forward these to the frontend via HTTP SSE (`text/event-stream`) or WebSocket. This improves UX by showing the answer as it’s generated.

## PDF Processing Pipeline  
1. **Upload Handling:** Express receives PDF (multer or similar). Save to disk (or cloud bucket) and record file path in `Document`.  
2. **Extract Text:** In background job, use `unpdf.extractText(pdf)` to get full text. If text is empty, optionally run OCR (see below).  
3. **Language/Encoding:** Use a library like `franc` to detect language if multi-language support needed. Re-encode text to UTF-8.  
4. **Chunking:** Split text into overlapping chunks of ~512 tokens (≈300–500 words) with ~50-token overlap to preserve context. Simple approach: split by paragraphs or fixed size. Store each chunk in the `Chunk` table.  
5. **Metadata:** Store original filename, upload date, page count (if needed), and optionally generate a thumbnail or cover image (with pdf.js) for UI preview.  
6. **OCR Fallback:** If `extractText` yields no content (scanned image PDF), use an OCR model: e.g. Hugging Face’s layoutLM/TrOCR (via the Vision API) or Google’s Tesseract (via `tesseract.js`). Example: use `@huggingface/inference` image-to-text pipeline with `microsoft/trocr-base-handwritten`. Then chunk as above.  
7. **Indexing:** After chunking and embedding (next step), consider caching by storing a “processed” flag on Document to avoid re-processing.  

_Citing:_ We use `unpdf` because it “ships with a serverless build of PDF.js… perfect for AI applications that need to summarize or analyze PDF documents”.

## Retrieval-Augmented Generation (RAG) Design  
- **Embedding Generation:** After chunking, for each chunk call the HF `featureExtraction` endpoint to get a float vector. Use a model like `all-MiniLM-L6-v2` or `hkunlp/instructor-large`. Batch requests if possible (the HF API supports sending multiple texts).  
- **Vector Store:** Since SQLite has no native vector type, use the **SQLite-Vector extension**. This allows storing vectors as `BLOB`s and querying by cosine distance. Store embeddings in the `embedding` column of `Chunk`.  
  - Example:  
    ```sql
    CREATE TABLE chunks (id INTEGER PRIMARY KEY, documentId INTEGER, text TEXT, embedding BLOB);
    -- Insert using: vector_as_f32(JSON) or BLOB from Node
    SELECT id FROM chunks ORDER BY vector_cosine_distance(embedding, vector_as_f32(?)) LIMIT 5;
    ```  
  - This avoids any separate vector DB service (“Zero preindexing needed”).  

- **Alternatives:** If SQLite-Vector is not used, other options:  
  - **FAISS (local):** could be used by periodically dumping embeddings to a FAISS index file. However, FAISS needs Python or C++.  
  - **Chroma DB:** open-source vector DB (requires separate container).  
  - **ElasticSearch / Weaviate:** heavy for MVP.  
  - **In-memory (HNSWlib via node):** possible but not persistent.  
  Given the SQLite-Vector extension is lightweight and zero-config, it’s ideal for our file-based DB scenario.  

- **Retrieval Pipeline:** On a query:  
  1. Compute embedding of the question (optional, or just use text search).  
  2. Query vector store: `SELECT * FROM chunks WHERE documentId=? ORDER BY cosine_distance(embedding, query_vector) LIMIT 5`. (SQLite-Vector provides `vector_cosine_distance`.)  
  3. Also consider a fallback TF-IDF filter or prefix search on chunk text for speed (e.g. SQL `LIKE '%keyword%'`).  
  4. Combine the top chunks’ text into the prompt.  

- **Caching:**  
  - Cache embeddings in SQLite (done).  
  - Cache popular query results in Redis or memory (question → chunk IDs) to avoid rerunning similar searches.  
  - Cache HF answers for identical Q&Doc (hash the input Q+Doc ID) to reuse API results, storing them in `messages`.  

## Background Jobs & Queue  
Use **BullMQ** (Node.js queue library backed by Redis) for processing tasks. Key jobs:  
- **Document Parsing Job:** Triggered after upload. Steps: extract text, OCR if needed, chunk, compute embeddings, update DB.  
- **Chat/QA Job:** Though user chat can be near-realtime, in high load scenarios we may queue it (especially for streaming). But simpler: handle each chat request as an immediate job in a “chat” queue to allow concurrency scaling.  

BullMQ code example:  
```js
const { Queue, Worker } = require('bullmq');
const parseQueue = new Queue('parse');
const chatQueue = new Queue('chat');

parseQueue.add('parseDocument', { docId });
const worker = new Worker('parse', async job => {
  const { docId } = job.data;
  // perform parsing (unpdf, chunk, embed)…
});
```

- **Concurrency & Infra:** BullMQ is production-grade (billions of jobs daily). Use Upstash or Redis Cloud (free tier) for minimal infra.  
- **Scaling:** Workers can run on the same server or separate processes/containers.  

## Frontend Architecture  

- **Pages/Components:**  
  - **Home/List Page:** Lists uploaded documents with upload button.  
  - **Upload Modal/Component:** Accepts PDF file.  
  - **Document Page:** Shows PDF preview (e.g. embed via `react-pdf` or PDF.js viewer), and a Chat interface below.  
  - **Chat Component:** Displays messages; uses an `<textarea>` for question input.  
  - **Streaming Output:** As the answer arrives (via SSE/WebSocket), append text to the latest “assistant” message.  
  - **Utilities:** Loading spinners, error banners.  

- **State Management:**  
  - Use **RTK Query** to manage API calls (e.g. uploading, fetching docs, posting questions). RTK Query handles caching and request deduplication.  
  - Store chat history in Redux slices (keyed by document ID).  
  - Chat queries: send via a streaming-aware hook (listening to EventSource).  

- **Streaming Rendering:**  
  - When user submits a question, open an `EventSource` to `/api/chat/:id/stream`. On each received chunk, dispatch an action to append to the latest message. Show a typing indicator until done.  

- **Error/Loading States:**  
  - Show spinners during file upload and doc processing.  
  - If backend processing is not yet done (no chunks), indicate “Document is being processed, please wait.”  
  - Catch network errors with toasts.  

- **UI Framework:**  
  - Use a component library for polish (e.g. Material-UI, Tailwind UI).  
  - Ensure mobile responsiveness (PDF view can be tricky; maybe just list of Q/A on small screens).  

```mermaid
flowchart LR
  subgraph User_Device
    UI[Frontend (React)] 
  end
  subgraph Server
    API[Express API Server]
    Worker[Parser/QA Workers (BullMQ)]
    Redis[(Redis)]
    DB[(SQLite DB)]
    HF[HuggingFace API]
  end
  UI -->|Upload PDF, Ask Q| API
  API --> Redis
  API -->|enqueue| Worker
  Worker --> DB
  Worker -->|call inference| HF
  API -->|retrieve data| DB
  API -->|stream chat| UI
  API --> Redis
```

## Development & Deployment Plan  

- **Docker:** Containerize both frontend and backend.  
  - **Backend Dockerfile:** Use Node 18, install dependencies, copy source, expose port 3000.  
  - **Frontend Dockerfile:** Build static React app, serve via Nginx or use Vercel (no container).  
- **CI/CD (GitHub Actions):**  
  - Lint (ESLint) & type-check (TypeScript).  
  - Run tests (Jest).  
  - On push to `main`, build Docker images and push to registry.  
  - Deploy:  
    - **Frontend:** to Vercel (GitHub integration; env var for HF token).  
    - **Backend:** to Render or Railway (connect SQLite file, Redis via add-on).  

- **Env & Secrets:** Store HF API token, Redis URL, and any secret keys in environment (e.g. `.env`). Use GitHub Secrets.  

- **Local Dev:** `docker-compose` with services for backend, Redis, and possibly a mock SQLite (volume mount). Alternatively, use SQLite file locally (no DB server needed).  

## Testing Plan  

- **Unit Tests:** Jest for utilities (text chunking, prompt formatting). Mock HF API with nock.  
- **Integration Tests:** Use Supertest to hit Express endpoints (e.g. upload PDF, get metadata). Use a small dummy PDF.  
- **E2E Tests:** Playwright or Cypress to simulate UI: upload a PDF, ask a question, verify answer appears. Use a stubbed backend or real HF calls (if rate allows). Key cases: multiple users/documents, empty PDF (OCR path), rate limit handling.  
- **Key Test Cases:**  
  - Document upload & parse (check DB entries).  
  - Text query returns answer (with mocked HF).  
  - Streaming endpoint returns SSE tokens.  
  - Vector search finds relevant chunks (insert test embeddings).  

_No direct citations_ needed for testing, but the use of Jest and Supertest is standard practice.

## Observability  

- **Logging:** Use a structured logger (Pino or Winston) for all backend services. Log levels: info for uploads/queries, warn for slow answers, error for failures.  
- **Metrics:** (Optional) Expose basic metrics (number of docs, queue size, API latency) via Prometheus format or APM (NewRelic).  
- **Error Reporting:** Integrate Sentry or Rollbar to capture exceptions from Express or background workers, especially AI errors.  

_Citing:_ BullMQ is “battle-tested… powering AI pipelines”, so logging key events (job completion, errors) will aid troubleshooting.

## Security & Privacy  

- **PDF Handling:** Store uploads in a non-public directory. Delete files and DB entries on document deletion. Use unique filenames/IDs to avoid path issues.  
- **API Keys:** Do not expose HF token to client; only use on server side. Ensure all environment variables are secure.  
- **Data Privacy:** PDF content is sensitive – mention in UI that data is processed only for the user’s session. Use HTTPS in production.  
- **Rate Limiting:** Prevent abuse by limiting requests per IP (e.g. express-rate-limit).  
- **CORS:** Configure CORS strictly (frontend domain only).  

## Phase 2 Roadmap  

Potential extensions after MVP:  
- **Resume Parser Mode:** Recognize resume documents and auto-generate ATS scores, highlight missing skills, suggest bullet improvements, and draft cover letters. (This builds on PDF chat by adding domain-specific prompts.)  
- **Export & Reports:** Allow exporting chat logs or summaries as PDF. Generate detailed analysis reports (e.g. PDF summary, question list) after a session.  
- **Quiz Generation:** From an uploaded text or notes, auto-create flashcards or MCQs (via prompts).  
- **Multi-User & Workspaces:** Add authentication and user profiles, with personal documents.  
- **Real-Time Co-Editing:** Collaborative Q&A or notes sharing (requires socket.io).  
- **Enhanced UI:** PDF annotation, highlighting text used in answers, theming.  

## Architecture & Data Flow Diagrams  

```mermaid
flowchart LR
  subgraph User
    U[User Browser]
  end
  subgraph System
    UP[Upload Service]
    EX[Text Extraction]
    CH[Chunk Storage]
    EMB[Embedding Store (SQLite-Vector)]
    QA[QA Service]
    AI[Hugging Face Model]
    FE[Frontend UI]
  end
  U -->|Upload PDF| UP
  UP --> EX
  EX --> CH
  CH --> EMB
  U -->|Ask Question| QA
  QA --> EMB
  EMB --> QA
  QA --> AI
  AI --> QA
  QA --> FE
  FE --> U
```

This design ensures a clean separation: uploads trigger processing pipelines, which feed into a RAG workflow for queries, all integrated via REST/WS APIs. 

**Sources:** We based our plan on official docs and proven best practices. For example, **`unpdf`** (PDF.js-based) is recommended for text extraction; **Hugging Face Inference API** supports text chat and embeddings with one client; and **SQLite-Vector** provides fast on-device vector search without extra infra. These references guided our architecture choices.  

