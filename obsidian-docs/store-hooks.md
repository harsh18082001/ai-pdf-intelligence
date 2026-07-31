---
tags: [frontend, store]
---
## Purpose
Typed Redux hooks — thin wrappers so components don't repeat generic type params.

## Key Details
- `useAppDispatch = () => useDispatch<AppDispatch>()`
- `useAppSelector: TypedUseSelectorHook<RootState> = useSelector`

## Source
`client/src/store/hooks.ts`

## Dependencies
- Imports: `RootState`, `AppDispatch` types from [[store]].
- Used by: [[useChat]] (`useAppDispatch`, to dispatch `chatApi.util.invalidateTags`).

## Related
- [[store]]
- [[useChat]]

## Notes
`useAppSelector` is defined but currently has no callers — there's no component reading directly from the RTK Query cache slice via `useSelector`; everything goes through the generated query/mutation hooks instead (`useGetDocumentsQuery`, etc.).
