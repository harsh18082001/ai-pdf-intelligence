import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

function getGuestSessionId(): string {
  let id = localStorage.getItem('dociq_guest_session_id');
  if (!id) {
    id = 'guest_' + crypto.randomUUID();
    localStorage.setItem('dociq_guest_session_id', id);
  }
  return id;
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || '/api',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('dociq_google_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      } else {
        headers.set('x-session-id', getGuestSessionId());
      }
      return headers;
    },
  }),
  tagTypes: ['Document', 'Message', 'AIArtifact'],
  endpoints: () => ({}),
});
