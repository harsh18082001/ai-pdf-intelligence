---
tags: [frontend, lib]
---
## Purpose
Single source of truth mapping a document's `status` string to its display config (label, icon, color tone) — replaces the `getStatusConfig` function that used to be copy-pasted in [[DocumentCard]] and `MetadataPanel` (now [[DocumentHeader]], since `MetadataPanel` was deleted).

## Key Details
- `getDocumentStatusConfig(status: string): StatusConfig` where `StatusConfig = { label, icon: LucideIcon, tone: StatusTone, spin?: boolean }`.
- `StatusTone = 'success' | 'info' | 'danger' | 'warning' | 'neutral'` — matches the tone-variant names added to the `Badge` ui primitive (`bg-{tone}/15 text-{tone}`).
- Mapping: `completed`→Ready (success), `processing`→Processing (info, `spin: true`), `failed`→Failed (danger), `ocr_required`→Needs OCR (warning), anything else→Pending (neutral).
- Pure function, no React/JSX — consumed by [[DocumentStatusBadge]], which renders the actual `Badge` + icon.

## Source
`client/src/lib/document-status.ts`

## Dependencies
- Imports: `lucide-react` icons (`CheckCircle2`, `Loader2`, `AlertCircle`, `Clock`).
- Used by: [[DocumentStatusBadge]].

## Related
- [[DocumentStatusBadge]]
- [[DocumentCard]]
- [[DocumentHeader]]
- [[Known-Issues-and-Conventions#Duplicated logic to be aware of, not "fix" reflexively]]

## Notes
If a new document status value is ever added server-side, update the `switch` here — both card views (grid tile and detail panel) will pick it up automatically since they no longer have their own copies of this logic.
