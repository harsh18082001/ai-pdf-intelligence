import { baseApi } from './baseApi';
import type { ApiResponse, DocumentDTO } from '../types';

export const documentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDocuments: builder.query<DocumentDTO[], void>({
      query: () => '/documents',
      transformResponse: (response: ApiResponse<DocumentDTO[]>) => response.data || [],
      providesTags: ['Document'],
    }),
    getDocument: builder.query<DocumentDTO, number>({
      query: (id) => `/documents/${id}`,
      transformResponse: (response: ApiResponse<DocumentDTO>) => response.data!,
      providesTags: (_result, _error, id) => [{ type: 'Document', id }],
    }),
    getDocumentStatus: builder.query<{ status: string; errorMsg?: string }, number>({
      query: (id) => `/documents/${id}/status`,
      transformResponse: (response: ApiResponse<{ status: string; errorMsg?: string }>) => response.data!,
    }),
    uploadDocument: builder.mutation<DocumentDTO, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: '/documents',
          method: 'POST',
          body: formData,
        };
      },
      transformResponse: (response: ApiResponse<DocumentDTO>) => response.data!,
      invalidatesTags: ['Document'],
    }),
    deleteDocument: builder.mutation<void, number>({
      query: (id) => ({
        url: `/documents/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Document'],
    }),
  }),
});

export const {
  useGetDocumentsQuery,
  useGetDocumentQuery,
  useGetDocumentStatusQuery,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
} = documentApi;
