import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export function getGuestSessionId(): string {
  let id = localStorage.getItem('dociq_client_id');
  if (!id) {
    id = 'usr_' + crypto.randomUUID();
    localStorage.setItem('dociq_client_id', id);
  }
  return id;
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || '/api',
    prepareHeaders: (headers) => {
      headers.set('x-session-id', getGuestSessionId());
      return headers;
    },
  }),
  tagTypes: ['Document', 'Message', 'AIArtifact'],
  endpoints: () => ({}),
});
