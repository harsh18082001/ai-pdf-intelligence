---
tags: [backend]
---
## Purpose
The shared `pino` logger instance used for all server-side structured logging.

## Key Details
```ts
export const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' } }
    : undefined,
});
```
Pretty-printed (colorized, human-readable) only in `development`; plain structured JSON in `production`/`test` (no `transport`), which is what you want for log aggregation.

## Source
`server/src/utils/logger.ts`

## Dependencies
- Imports: `pino`, `pino-pretty` (dev only), `env`.
- Used by: [[document.controller]] (unused import — dead), [[chat.controller]], [[document.service]] (unused import — dead), [[chat.service]] (not imported — uses `AppError` only), [[processing.service]], [[processor]], `server/src/index.ts`.

## Related
- [[Backend-Architecture]]
- [[ENV-Variables]]

## Notes
Level is controlled entirely by `LOG_LEVEL` (default `info`) — bump it to `debug` locally for verbose pipeline tracing (e.g. inside [[processing.service]]) without code changes.
