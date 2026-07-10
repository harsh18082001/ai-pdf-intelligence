import { baseApi } from './baseApi';
import type { ApiResponse, MessageDTO } from '../types';

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getChatHistory: builder.query<MessageDTO[], number>({
      query: (documentId) => `/documents/${documentId}/chat`,
      transformResponse: (response: ApiResponse<MessageDTO[]>) => response.data || [],
      providesTags: (_result, _error, documentId) => [{ type: 'Message', id: documentId }],
    }),
  }),
});

export const { useGetChatHistoryQuery } = chatApi;
