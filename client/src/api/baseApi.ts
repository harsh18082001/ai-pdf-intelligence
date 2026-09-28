import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { getAccessToken, setAccessToken } from '@/lib/token-store';

function getCsrfToken(): string | undefined {
  const match = document.cookie.match(/(?:^|; )dociq_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  credentials: 'include',
  prepareHeaders: (headers) => {
    const accessToken = getAccessToken();
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers.set('x-csrf-token', csrfToken);
    }
    return headers;
  },
});

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(api: Parameters<BaseQueryFn>[1], extraOptions: unknown): Promise<boolean> {
  const result = await rawBaseQuery(
    { url: '/auth/refresh', method: 'POST' },
    api,
    extraOptions as object,
  );
  const data = result.data as { data?: { accessToken?: string } } | undefined;
  if (data?.data?.accessToken) {
    setAccessToken(data.data.accessToken);
    return true;
  }
  setAccessToken(null);
  return false;
}

/** Wraps fetchBaseQuery: on a 401 (expired access token) it refreshes once via the httpOnly
 * refresh cookie and retries the original request, so the SPA never has to hold long-lived
 * secrets in JS-accessible storage. */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const url = typeof args === 'string' ? args : args.url;
    if (!url.includes('/auth/')) {
      refreshPromise ??= refreshSession(api, extraOptions).finally(() => {
        refreshPromise = null;
      });
      const refreshed = await refreshPromise;
      if (refreshed) {
        result = await rawBaseQuery(args, api, extraOptions);
      }
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Document', 'Message', 'AIArtifact', 'User'],
  endpoints: () => ({}),
});
