---
tags: [frontend]
---
## Purpose
The single `cn()` classname-merging helper used across every styled component.

## Key Details
```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```
`clsx` handles conditional class composition (`cn('a', cond && 'b')`); `twMerge` then resolves conflicting Tailwind utility classes (e.g. `p-2` vs `p-4`) so the last one wins instead of both applying.

## Source
`client/src/lib/utils.ts`

## Dependencies
- Imports: `clsx`, `tailwind-merge`.
- Used by: nearly every component with conditional styling — [[ChatInput]], [[ChatInterface]], [[ChatMessage]], [[DocumentCard]], [[MetadataPanel]], [[UploadDropzone]], etc.

## Related
- [[Frontend-Architecture]]

## Notes
Standard shadcn/ui convention — if you add a new styled component with conditional classes, use `cn()` rather than string-concatenating class names, to keep Tailwind conflict resolution consistent.
