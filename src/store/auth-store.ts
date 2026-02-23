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
} from '@/types/auth';
import apiClient from '@/lib/api/client';
import { getPrimaryRoleFromBackendRoles } from '@/lib/auth/dashboard-role-paths';
import { getAuthMe } from '@/lib/api/auth';

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
  fetchMe: () => Promise<void>;
  bootstrap: () => Promise<void>;
  clearAuthSession: () => void;
  logout: () => void;
  clearError: () => void;
}

function setRoleCookieFromBackendRoles(roles: string[] | undefined) {
  if (typeof document === 'undefined') return;
  const primaryRole = getPrimaryRoleFromBackendRoles(roles);
  if (!primaryRole) return;

  // Server components read this cookie via next/headers (see lib/auth/mock-session.ts)
  document.cookie = `academia_role=${encodeURIComponent(primaryRole)}; Path=/; Max-Age=${60 * 60 * 24 * 30}`;
}

function clearRoleCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'academia_role=; Path=/; Max-Age=0';
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
        } catch (error: unknown) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const message = (error as Error)?.message || ((error as any)?.response?.data?.message) || 'Registration failed';
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
        } catch (error: unknown) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const message = (error as Error)?.message || ((error as any)?.response?.data?.message) || 'OTP verification failed';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      resendEmailOtp: async (dto: ResendEmailOtpDto): Promise<void> => {
        set({ isLoading: true, error: undefined });

        try {
          await apiClient.post('/auth/email-verification/resend', dto);
          set({ isLoading: false });
        } catch (error: unknown) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const message = (error as Error)?.message || ((error as any)?.response?.data?.message) || 'Failed to resend OTP';
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

          setRoleCookieFromBackendRoles(result.user?.roles);

          // Best-effort: replace the lightweight login user with canonical /me payload.
          try {
            await get().fetchMe();
          } catch {
            // Ignore; user is still authenticated from login response.
          }
        } catch (error: unknown) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const message = (error as Error)?.message || ((error as any)?.response?.data?.message) || 'Login failed';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      fetchMe: async (): Promise<void> => {
        set({ isLoading: true, error: undefined });
        try {
          const me = await getAuthMe();

          set({
            user: me as AuthUser,
            tenantDomain: me.tenantDomain ?? get().tenantDomain,
            isLoading: false,
          });

          setRoleCookieFromBackendRoles(me.roles);
        } catch (error: unknown) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const message = (error as Error)?.message || ((error as any)?.response?.data?.message) || 'Failed to load profile';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      bootstrap: async (): Promise<void> => {
        const { accessToken, user } = get();
        if (!accessToken) {
          return;
        }

        // If we already have a user, keep it; otherwise hydrate via /me.
        if (!user) {
          try {
            await get().fetchMe();
          } catch {
            // If /me fails, axios interceptor will handle 401 -> logout.
          }
        } else {
          setRoleCookieFromBackendRoles(user.roles);
        }
      },

      clearAuthSession: () => {
        set({
          accessToken: undefined,
          refreshToken: undefined,
          user: undefined,
          error: undefined,
        });

        clearRoleCookie();
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

        clearRoleCookie();
      },

      clearError: () => {
        set({ error: undefined });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        tenantDomain: state.tenantDomain,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);