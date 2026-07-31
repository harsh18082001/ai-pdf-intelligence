---
tags: [frontend, component]
---
## Purpose
The `⌘K`/`Ctrl K` command palette: fuzzy-jump to any document, or run a quick action (upload, go home, change theme).

## Key Details
- `CommandPalette({ open, onOpenChange }: CommandPaletteProps)` — fully controlled; [[AppSidebar]] owns the open state and the global keyboard shortcut that toggles it.
- Built on `components/ui/command.tsx` (the `cmdk` wrapper, standard shadcn recipe) — `CommandDialog` internally renders `cmdk`'s `Command` inside the project's own `Dialog`/`DialogContent` (not `cmdk`'s own `Command.Dialog`, which would pull in a second, unstyled Radix Dialog instance).
- Two `CommandGroup`s:
  - **Actions** — "Go to Home" (`navigate('/')`), "Upload Document" (`navigate('/?upload=1')` — see [[UploadModal]]'s `autoOpenFromUrl`), and Light/Dark/System theme (`useTheme().setTheme`).
  - **Documents** — only rendered when `documents.length > 0`; maps `useGetDocumentsQuery()` results to `CommandItem`s with `value={doc.title}` (for cmdk's built-in fuzzy filtering) and a trailing status label from [[document-status]]. Selecting one navigates to `/documents/:id`.
- Every selection calls `onOpenChange(false)` before/alongside navigating, so the palette always closes on action.

## Source
`client/src/components/command-palette.tsx` (app-specific instance) + `client/src/components/ui/command.tsx` (the generic `cmdk` wrapper: `Command`, `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`)

## Dependencies
- Imports: `components/ui/command.tsx`, [[documentApi]] (`useGetDocumentsQuery`), [[theme-provider]] (`useTheme`), [[document-status]] (`getDocumentStatusConfig`), `react-router-dom` (`useNavigate`).
- Used by: [[AppSidebar]] (the only place it's mounted).

## Related
- [[AppSidebar]]
- [[UploadModal]]
- [[document-status]]
- [[documentApi]]

## Notes
`CommandDialog`'s `DialogTitle`/`DialogDescription` must be rendered **inside** `DialogContent` (they were initially placed as siblings of it, which meant they existed in the DOM unconditionally regardless of open state — Radix's `Dialog.Root` doesn't gate its non-`Portal` children on `open`). If you touch `components/ui/command.tsx`, keep them nested inside `DialogContent`.
