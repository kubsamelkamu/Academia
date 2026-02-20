import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AuthUser,
  RegisterInstitutionDto,
  RegisterResult,
  VerifyEmailOtpDto,
  ResendEmailOtpDto,
  LoginDto,
  LoginResult,
  ApiResponse,
} from '@/types/auth';
import apiClient from '@/lib/api/client';

interface AuthState {
  // Temporary onboarding state
  tenantDomain?: string;
  pendingEmailVerification?: boolean;
  registration?: RegisterResult;

  // Persistent auth state
  accessToken?: string;
  refreshToken?: string;
  user?: AuthUser;

  // Loading states
  isLoading: boolean;
  error?: string;

  // Actions
  registerInstitution: (dto: RegisterInstitutionDto) => Promise<RegisterResult>;
  verifyEmailOtp: (dto: VerifyEmailOtpDto) => Promise<void>;
  resendEmailOtp: (dto: ResendEmailOtpDto) => Promise<void>;
  login: (dto: LoginDto) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoading: false,

      registerInstitution: async (dto: RegisterInstitutionDto): Promise<RegisterResult> => {
        set({ isLoading: true, error: undefined });

        try {
          const response = await apiClient.post<RegisterResult>(
            '/auth/register/institution',
            dto
          );

          const result = response.data;

          set({
            tenantDomain: result.institution.domain,
            registration: result,
            pendingEmailVerification: true,
            isLoading: false,
          });

          return result;
        } catch (error: any) {
          const message = error.message || error.response?.data?.message || 'Registration failed';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      verifyEmailOtp: async (dto: VerifyEmailOtpDto): Promise<void> => {
        set({ isLoading: true, error: undefined });

        try {
          await apiClient.post('/auth/email-verification/verify', dto);

          set({
            pendingEmailVerification: false,
            isLoading: false,
          });
        } catch (error: any) {
          const message = error.message || error.response?.data?.message || 'OTP verification failed';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      resendEmailOtp: async (dto: ResendEmailOtpDto): Promise<void> => {
        set({ isLoading: true, error: undefined });

        try {
          await apiClient.post('/auth/email-verification/resend', dto);
          set({ isLoading: false });
        } catch (error: any) {
          const message = error.message || error.response?.data?.message || 'Failed to resend OTP';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      login: async (dto: LoginDto): Promise<void> => {
        set({ isLoading: true, error: undefined });

        try {
          // Use stored tenantDomain if not provided in the form
          const loginData = {
            ...dto,
            tenantDomain: dto.tenantDomain || get().tenantDomain,
          };

          const response = await apiClient.post<LoginResult>('/auth/login', loginData);
          const result = response.data;

          set({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user,
            tenantDomain: loginData.tenantDomain,
            isLoading: false,
          });
        } catch (error: any) {
          const message = error.message || error.response?.data?.message || 'Login failed';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      logout: () => {
        set({
          tenantDomain: undefined,
          pendingEmailVerification: undefined,
          registration: undefined,
          accessToken: undefined,
          refreshToken: undefined,
          user: undefined,
          error: undefined,
        });
      },

      clearError: () => {
        set({ error: undefined });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        tenantDomain: state.tenantDomain,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);