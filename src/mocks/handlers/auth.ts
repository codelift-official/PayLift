import { http, HttpResponse } from 'msw';
import type {
  AuthResponse,
  MessageResponse,
  UserProfileResponse,
  LoginRequest,
  VerifyOtpRequest,
  ChangePasswordRequest,
} from '../../api/types';
import { seedStore } from '../seed';

export const authHandlers = [
  // POST /api/v1/auth/login
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as LoginRequest;
    if (body.email && body.email.includes('wrong')) {
      return HttpResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }
    if (body.tenant === 'suspended') {
      return HttpResponse.json({ error: 'Business suspended.' }, { status: 403 });
    }

    const authRes: AuthResponse = {
      accessToken: 'mock-access-token-xyz-12345',
      refreshToken: 'mock-refresh-token-abc-67890',
      expiresIn: 3600,
      tokenType: 'Bearer',
      userID: seedStore.users[0].userID,
      tenantID: seedStore.business.id,
      role: seedStore.users[0].role,
    };
    return HttpResponse.json(authRes, { status: 200 });
  }),

  // POST /api/v1/auth/refresh
  http.post('/api/v1/auth/refresh', async () => {
    const authRes: AuthResponse = {
      accessToken: 'mock-refreshed-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      expiresIn: 3600,
      tokenType: 'Bearer',
      userID: seedStore.users[0].userID,
      tenantID: seedStore.business.id,
      role: seedStore.users[0].role,
    };
    return HttpResponse.json(authRes, { status: 200 });
  }),

  // POST /api/v1/auth/logout
  http.post('/api/v1/auth/logout', async () => {
    const res: MessageResponse = { message: 'Logged out successfully' };
    return HttpResponse.json(res, { status: 200 });
  }),

  // POST /api/v1/auth/otp/send
  http.post('/api/v1/auth/otp/send', async ({ request }) => {
    await request.json();
    const res: MessageResponse = { message: 'OTP sent to mobile successfully' };
    return HttpResponse.json(res, { status: 200 });
  }),

  // POST /api/v1/auth/otp/verify
  http.post('/api/v1/auth/otp/verify', async ({ request }) => {
    const body = (await request.json()) as VerifyOtpRequest;
    if (body.code !== '123456') {
      return HttpResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }
    const authRes: AuthResponse = {
      accessToken: 'mock-otp-access-token-999',
      refreshToken: 'mock-otp-refresh-token-999',
      expiresIn: 3600,
      tokenType: 'Bearer',
      userID: seedStore.users[0].userID,
      tenantID: seedStore.business.id,
      role: seedStore.users[0].role,
    };
    return HttpResponse.json(authRes, { status: 200 });
  }),

  // POST /api/v1/auth/forgot-password
  http.post('/api/v1/auth/forgot-password', async () => {
    const res: MessageResponse = {
      message: 'If the account exists, a password reset link has been dispatched.',
    };
    return HttpResponse.json(res, { status: 200 });
  }),

  // POST /api/v1/auth/reset-password
  http.post('/api/v1/auth/reset-password', async () => {
    const res: MessageResponse = { message: 'Password has been reset successfully.' };
    return HttpResponse.json(res, { status: 200 });
  }),

  // GET /api/v1/user/profile
  http.get('/api/v1/user/profile', async () => {
    const profile: UserProfileResponse = seedStore.users[0];
    return HttpResponse.json(profile, { status: 200 });
  }),

  // POST /api/v1/user/change-password
  http.post('/api/v1/user/change-password', async ({ request }) => {
    const body = (await request.json()) as ChangePasswordRequest;
    if (body.currentPassword === 'wrong') {
      return HttpResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }
    const res: MessageResponse = { message: 'Password changed successfully' };
    return HttpResponse.json(res, { status: 200 });
  }),
];
