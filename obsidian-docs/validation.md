---
tags: [backend, middleware]
---
## Purpose
Zod-based request body validation middleware, plus the three schemas used across routes.

## Key Details
- `validate(schema: AnyZodObject)` — returns middleware that does `await schema.parseAsync(req.body)` then `next()`; on failure calls `next(error)` (a `ZodError`), which [[error-handler]] turns into a `400` with `details: err.errors`.
- `chatMessageSchema = z.object({ message: z.string().min(1).max(5000) })` — used by [[chat.routes]] on `POST /`.
- `commandSchema = z.object({ documentId: z.number().int().positive(), command: z.string().refine(val => ARTIFACT_TYPES.includes(val)), regenerate: z.boolean().optional() })` — used by [[command.routes]].
- `idParamSchema = z.object({ id: z.string().regex(/^\d+$/) })` — defined but **not currently wired into any route's middleware chain**; [[document.routes]] imports it but never calls `validate(idParamSchema)` (ID params are checked manually in controllers instead, since `validate()` only reads `req.body`, not `req.params`).

## Source
`server/src/middlewares/validation.ts`

## Dependencies
- Imports: `zod`, `ARTIFACT_TYPES` constant.
- Used by: [[chat.routes]] (`chatMessageSchema`), [[command.routes]] (`commandSchema`).

## Related
- [[chat.routes]]
- [[command.routes]]
- [[document.routes]]
- [[API-Contract]]

## Notes
`validate()` as written can only ever validate `req.body` — if you want to validate `req.params` or `req.query` (e.g. actually using `idParamSchema`), this function needs a second parameter for which part of the request to check, or a separate `validateParams()` helper. Don't assume adding `validate(idParamSchema)` to a route will do anything useful as-is.
