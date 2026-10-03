import { apiClient } from './client';
import {
  LoginRequest,
  AuthResponse,
  SendOtpRequest,
  VerifyOtpRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  CreateBusinessRequest,
  BusinessResponse,
  UserProfileResponse,
  ChangePasswordRequest,
  MessageResponse,
} from './types';

export const authApi = {
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/api/v1/auth/login', payload, {
      headers: { 'X-Tenant-Slug': payload.tenant },
    });
    return res.data;
  },

  sendOtp: async (payload: SendOtpRequest): Promise<MessageResponse> => {
    const res = await apiClient.post<MessageResponse>('/api/v1/auth/otp/send', payload, {
      headers: { 'X-Tenant-Slug': payload.tenant },
    });
    return res.data;
  },

  verifyOtp: async (payload: VerifyOtpRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/api/v1/auth/otp/verify', payload, {
      headers: { 'X-Tenant-Slug': payload.tenant },
    });
    return res.data;
  },

  refresh: async (payload: RefreshTokenRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/api/v1/auth/refresh', payload);
    return res.data;
  },

  logout: async (refreshToken: string): Promise<MessageResponse> => {
    const res = await apiClient.post<MessageResponse>('/api/v1/auth/logout', { refreshToken });
    return res.data;
  },

  forgotPassword: async (payload: ForgotPasswordRequest): Promise<MessageResponse> => {
    const res = await apiClient.post<MessageResponse>('/api/v1/auth/forgot-password', payload, {
      headers: { 'X-Tenant-Slug': payload.tenant },
    });
    return res.data;
  },

  resetPassword: async (payload: ResetPasswordRequest): Promise<MessageResponse> => {
    const res = await apiClient.post<MessageResponse>('/api/v1/auth/reset-password', payload, {
      headers: { 'X-Tenant-Slug': payload.tenant },
    });
    return res.data;
  },

  setupBusiness: async (payload: CreateBusinessRequest): Promise<BusinessResponse> => {
    const res = await apiClient.post<BusinessResponse>('/api/v1/businesses/setup', payload);
    return res.data;
  },

  getProfile: async (): Promise<UserProfileResponse> => {
    const res = await apiClient.get<UserProfileResponse>('/api/v1/user/profile');
    return res.data;
  },

  changePassword: async (payload: ChangePasswordRequest): Promise<MessageResponse> => {
    const res = await apiClient.post<MessageResponse>('/api/v1/user/change-password', payload);
    return res.data;
  },

  getCurrentBusiness: async () => {
    const res = await apiClient.get<import('./types').BusinessesResponse>('/api/v1/businesses/current');
    return res.data;
  },
};
