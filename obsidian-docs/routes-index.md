---
tags: [backend, api]
---
## Purpose
Root API router — mounts the three route files under `/api`.

## Key Details
```ts
router.use('/documents', documentRoutes);
router.use('/documents/:documentId/chat', chatRoutes);
router.use('/commands', commandRoutes);
```
Mounted itself at `/api` in `app.ts` (`app.use('/api', apiRoutes)`).

## Source
`server/src/routes/index.ts`

## Dependencies
- Imports: [[document.routes]], [[chat.routes]], [[command.routes]].
- Used by: `server/src/app.ts`.

## Related
- [[document.routes]]
- [[chat.routes]]
- [[command.routes]]
- [[Backend-Architecture]]

## Notes
Note the chat router is mounted on a path that already includes `:documentId` (`/documents/:documentId/chat`) — [[chat.routes]] relies on `Router({ mergeParams: true })` to see that param.
