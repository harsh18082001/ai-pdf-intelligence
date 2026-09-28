import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { AppError } from '../middlewares/error-handler.js';
import { REFRESH_COOKIE, setRefreshCookie, clearRefreshCookie, getCookie } from '../utils/cookies.js';
import { env } from '../config/env.js';
import type { ApiResponse, UserDTO } from '../types/index.js';

function meta(req: Request) {
  return {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    guestSessionId: req.guestId,
  };
}

function applySession(
  res: Response,
  tokens: { accessToken: string; refreshToken: string; refreshExpiresAt: Date },
) {
  setRefreshCookie(res, tokens.refreshToken, tokens.refreshExpiresAt.getTime() - Date.now());
}

export const register = async (
  req: Request,
  res: Response<ApiResponse<{ user: UserDTO; accessToken: string }>>,
) => {
  const { user, tokens } = await authService.register(req.body, meta(req));
  applySession(res, tokens);
  res.status(201).json({ success: true, data: { user, accessToken: tokens.accessToken } });
};

export const login = async (
  req: Request,
  res: Response<ApiResponse<{ user: UserDTO; accessToken: string }>>,
) => {
  const { user, tokens } = await authService.login(req.body, meta(req));
  applySession(res, tokens);
  res.status(200).json({ success: true, data: { user, accessToken: tokens.accessToken } });
};

export const refresh = async (
  req: Request,
  res: Response<ApiResponse<{ user: UserDTO; accessToken: string }>>,
) => {
  const refreshToken = getCookie(req, REFRESH_COOKIE);
  if (!refreshToken) throw new AppError('No active session', 401);

  const { user, tokens } = await authService.refresh(refreshToken, {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });
  applySession(res, tokens);
  res.status(200).json({ success: true, data: { user, accessToken: tokens.accessToken } });
};

export const logout = async (req: Request, res: Response<ApiResponse>) => {
  const refreshToken = getCookie(req, REFRESH_COOKIE);
  await authService.logout(refreshToken);
  clearRefreshCookie(res);
  res.status(200).json({ success: true });
};

export const logoutAll = async (req: Request, res: Response<ApiResponse>) => {
  if (req.owner?.type !== 'user') throw new AppError('Authentication required', 401);
  await authService.logoutAll(req.owner.id);
  clearRefreshCookie(res);
  res.status(200).json({ success: true });
};

export const me = async (req: Request, res: Response<ApiResponse<UserDTO>>) => {
  if (req.owner?.type !== 'user') throw new AppError('Authentication required', 401);
  const user = await authService.me(req.owner.id);
  res.status(200).json({ success: true, data: user });
};

export const verifyEmail = async (req: Request, res: Response<ApiResponse>) => {
  const token = req.query.token as string;
  if (!token) throw new AppError('Verification token is required', 400);
  await authService.verifyEmail(token);
  res.status(200).json({ success: true, message: 'Email verified successfully' });
};

export const resendVerification = async (req: Request, res: Response<ApiResponse>) => {
  await authService.resendVerification(req.body.email);
  res.status(200).json({
    success: true,
    message: 'If an account exists for that email, a verification link has been sent.',
  });
};

export const forgotPassword = async (req: Request, res: Response<ApiResponse>) => {
  await authService.forgotPassword(req.body.email);
  res.status(200).json({
    success: true,
    message: 'If an account exists for that email, a password reset link has been sent.',
  });
};

export const resetPassword = async (req: Request, res: Response<ApiResponse>) => {
  await authService.resetPassword(req.body.token, req.body.password);
  res.status(200).json({ success: true, message: 'Password reset successfully' });
};

export const csrfToken = async (req: Request, res: Response<ApiResponse<{ csrfToken: string }>>) => {
  res.status(200).json({ success: true, data: { csrfToken: req.csrfToken || '' } });
};
