import { baseApi } from './baseApi';
import type { ApiResponse, AIArtifactDTO } from '../types';

interface ExecuteCommandRequest {
  documentId: number;
  command: string;
  regenerate?: boolean;
}

export const commandApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    executeCommand: builder.mutation<AIArtifactDTO, ExecuteCommandRequest>({
      query: (body) => ({
        url: '/commands',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<AIArtifactDTO>) => {
        if (!response.data) throw new Error('No data returned');
        return response.data;
      },
      invalidatesTags: (_result, _error, { documentId }) => [{ type: 'AIArtifact', id: documentId }],
    }),
  }),
});

export const { useExecuteCommandMutation } = commandApi;
