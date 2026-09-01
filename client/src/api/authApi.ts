import { baseApi } from './baseApi';
import { setAccessToken } from '@/lib/token-store';
import type { ApiResponse } from '../types';

export interface UserDTO {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
}

interface AuthPayload {
  user: UserDTO;
  accessToken: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<UserDTO, { email: string; password: string; name?: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      transformResponse: (response: ApiResponse<AuthPayload>) => {
        setAccessToken(response.data!.accessToken);
        return response.data!.user;
      },
      invalidatesTags: ['Document', 'User'],
    }),
    login: builder.mutation<UserDTO, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      transformResponse: (response: ApiResponse<AuthPayload>) => {
        setAccessToken(response.data!.accessToken);
        return response.data!.user;
      },
      invalidatesTags: ['Document', 'User'],
    }),
    refresh: builder.mutation<UserDTO | null, void>({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
      transformResponse: (response: ApiResponse<AuthPayload>) => {
        if (!response.data) return null;
        setAccessToken(response.data.accessToken);
        return response.data.user;
      },
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      onQueryStarted: () => {
        setAccessToken(null);
      },
      invalidatesTags: ['Document', 'User'],
    }),
    me: builder.query<UserDTO, void>({
      query: () => '/auth/me',
      transformResponse: (response: ApiResponse<UserDTO>) => response.data!,
      providesTags: ['User'],
    }),
    resendVerification: builder.mutation<void, { email: string }>({
      query: (body) => ({ url: '/auth/resend-verification', method: 'POST', body }),
    }),
    forgotPassword: builder.mutation<void, { email: string }>({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),
    resetPassword: builder.mutation<void, { token: string; password: string }>({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),
    verifyEmail: builder.mutation<void, { token: string }>({
      query: ({ token }) => ({ url: `/auth/verify-email?token=${encodeURIComponent(token)}` }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useMeQuery,
  useResendVerificationMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
} = authApi;
