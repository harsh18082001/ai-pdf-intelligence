import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || '/api',
    prepareHeaders: (headers) => {
      const clientId = localStorage.getItem('dociq_client_id');
      if (clientId) {
        headers.set('x-client-id', clientId);
      }
      return headers;
    },
  }),
  tagTypes: ['Document', 'Message', 'AIArtifact'],
  endpoints: () => ({}),
});
