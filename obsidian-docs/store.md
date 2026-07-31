---
tags: [frontend, store]
---
## Purpose
Redux store configuration — registers RTK Query's `baseApi` reducer/middleware and wires up `refetchOnFocus`/`refetchOnReconnect` behavior.

## Key Details
- `store = configureStore({ reducer: { [baseApi.reducerPath]: baseApi.reducer }, middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware) })`
- `setupListeners(store.dispatch)` enables RTK Query's automatic refetch-on-window-focus/reconnect behavior.
- Exported types: `RootState = ReturnType<typeof store.getState>`, `AppDispatch = typeof store.dispatch`.
- **The only slice in the store is `api` (RTK Query's cache)** — there is no hand-written application-level Redux slice/reducer anywhere in this project. All non-API local state lives in component `useState`/hooks.

## Source
`client/src/store/store.ts`

## Dependencies
- Imports: [[baseApi]].
- Used by: `main.tsx` (`<Provider store={store}>`), [[store-hooks|store/hooks.ts]] (typed `useAppDispatch`/`useAppSelector`).

## Related
- [[baseApi]]
- [[Frontend-Architecture#Redux store shape]]

## Notes
If you need genuine client-only global state (not server cache), there is no existing slice pattern to follow in this repo — you'd be introducing the first one via `configureStore`'s `reducer` map.
