---
tags: [backend, worker]
---
## Purpose
The "worker" entry point that kicks off document processing after upload. In practice a thin wrapper, not a separate process/queue.

## Key Details
- `processDocumentAsync(documentId: number, fileBuffer: Buffer, clientId?: string): Promise<void>` — calls `processingService.processDocument(documentId, fileBuffer, clientId)` and attaches a `.catch()` that logs any *unhandled* error (in practice `processDocument` already catches all its own errors internally and marks the document `FAILED`, so this catch is a safety net for truly unexpected throws, e.g. a bug in the catch block itself).
- **Returns the promise** rather than firing-and-forgetting it — the code comment is explicit: "Return the promise so it can be awaited for Vercel serverless compatibility." Serverless functions are killed once the response is sent / the function returns, so background processing (as a truly async "worker") would be silently terminated on a platform like Vercel. [[document.service]]`.upload()` `await`s this call, making the whole upload HTTP request block until processing fully finishes.
- There is no job queue, no separate worker process, no polling mechanism — "worker" here is a naming/conceptual boundary (kept separate from `processing.service.ts` for testability/organization), not a different runtime.

## Source
`server/src/workers/processor.ts`

## Dependencies
- Imports: [[processing.service]] (`processingService.processDocument`), `logger`.
- Called by: [[document.service]]`.upload()` (the only caller).

## Related
- [[processing.service]]
- [[document.service]]
- [[Data-Flow#1. Upload flow]]
- [[Known-Issues-and-Conventions#Upload is synchronous end-to-end, not a background job]]

## Notes
If you're asked to "make upload async" or "add a progress bar for processing," know that today there is no async job to poll — the entire pipeline runs inline within the upload request/response cycle. Introducing real backgrounding would require either a queue (BullMQ/pg-boss/etc.) or, if staying serverless-friendly, a different mechanism than `await`ing this function inline (e.g. Vercel's `waitUntil`, with a separate status-polling endpoint — `document.service.getProcessingStatus()` already exists for this but nothing calls it yet).
