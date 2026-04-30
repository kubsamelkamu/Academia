'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { loginSchema, LoginFormData } from '@/validations/auth';
import { getDashboardRoleSlug, getPrimaryRoleFromBackendRoles } from '@/lib/auth/dashboard-role-paths';
import { DEFAULT_RATE_LIMIT_RETRY_AFTER_MS, getErrorMessage, isRateLimitMessage } from '@/lib/api/errors';
import { InvitationOnboardingShell } from '@/components/auth/invitation-onboarding-shell';
import {
  AuthCampusBackdrop,
  AUTH_FORM_INPUT_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
} from '@/components/auth/auth-campus-backdrop';
import { cn } from '@/lib/utils';
import { clearInviteAcceptResult, readInviteAcceptResult } from '@/lib/auth/invite-onboarding-storage';
import {
  AuthTiltCard,
  AUTH_CONTAINER_VARIANTS,
  AUTH_ITEM_VARIANTS,
} from '@/components/auth/auth-tilt-card';

const capabilities = [
  'Real-time project tracking & management',
  'Automated defense scheduling system',
  'Multi-role user management',
  'Comprehensive reporting & analytics',
  'Secure multi-tenant architecture',
];

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error, clearError, tenantDomain, user, logout } = useAuthStore();
  const isInviteFlow = (searchParams.get('from') ?? '') === 'invite';
  const isTenantDebug = useMemo(() => {
    if (process.env.NODE_ENV === 'production') return false;
    return (searchParams.get('debugTenant') ?? '') === '1';
  }, [searchParams]);
  const inviteContext = useMemo(() => {
    if (!isInviteFlow) return null;
    return readInviteAcceptResult();
  }, [isInviteFlow]);
  const inviteEmailPrefill = useMemo(() => inviteContext?.result.email ?? '', [inviteContext]);
  const inviteTenantDomain = useMemo(() => {
    if (!isInviteFlow) return '';
    return (searchParams.get('tenantDomain') ?? inviteContext?.tenantDomain ?? '').trim();
  }, [inviteContext?.tenantDomain, isInviteFlow, searchParams]);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isInviteFlow) return;
    if (!inviteTenantDomain) return;

    const currentTenant = useAuthStore.getState().tenantDomain;
    if (currentTenant !== inviteTenantDomain) {
      useAuthStore.setState({ tenantDomain: inviteTenantDomain });
    }

    if (isTenantDebug) {
      console.info('[tenant-debug] invite login tenant resolution', {
        inviteTenantDomain,
        storeTenantDomainBefore: currentTenant,
        storeTenantDomainAfter: useAuthStore.getState().tenantDomain,
        urlTenantDomainParam: (searchParams.get('tenantDomain') ?? '').trim() || undefined,
        hasInviteContext: Boolean(inviteContext),
        inviteContextTenantDomain: (inviteContext?.tenantDomain ?? '').trim() || undefined,
      });
    }
  }, [inviteContext, inviteTenantDomain, isInviteFlow, isTenantDebug, searchParams]);

  useEffect(() => {
    if (!isInviteFlow) return;
    if (!inviteContext) return;
    clearInviteAcceptResult();
  }, [inviteContext, isInviteFlow]);

  useEffect(() => {
    if (!isRateLimited) return;
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
    cooldownTimerRef.current = setTimeout(() => {
      setIsRateLimited(false);
      cooldownTimerRef.current = null;
    }, DEFAULT_RATE_LIMIT_RETRY_AFTER_MS);
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, [isRateLimited]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: inviteEmailPrefill,
      password: '',
      tenantDomain: inviteTenantDomain || undefined,
    },
  });

  const emailValue = useWatch({ control, name: 'email' }) ?? '';
  const forgotPasswordHref = emailValue.trim()
    ? `/forgot-password?email=${encodeURIComponent(emailValue.trim())}`
    : '/forgot-password';

  const redirectToDashboard = useCallback((userRoles?: string[]) => {
    const primaryRole = getPrimaryRoleFromBackendRoles(userRoles);
    router.push(primaryRole ? `/dashboard/${getDashboardRoleSlug(primaryRole)}` : '/dashboard');
  }, [router]);

  useEffect(() => {
    if (user?.mustChangePassword) {
      router.push(isInviteFlow ? '/change-password?from=invite' : '/change-password');
    }
  }, [isInviteFlow, router, user, redirectToDashboard]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      await login(data);
      const state = useAuthStore.getState();
      if (state.user?.mustChangePassword) {
        router.push(isInviteFlow ? '/change-password?from=invite' : '/change-password');
        return;
      }

      const primaryRole = getPrimaryRoleFromBackendRoles(state.user?.roles);
      if (primaryRole === 'department_head' && state.user?.tenantVerification !== undefined) {
        const status = state.user.tenantVerification?.status ?? null;
        const documentNotSubmitted = status === null;
        if (documentNotSubmitted) {
          router.replace('/dashboard/settings?tab=verification');
          return;
        }
      }
      redirectToDashboard(state.user?.roles);
    } catch (e: unknown) {
      const message = getErrorMessage(e, '');
      if (message === 'account is not active') {
        router.push('/account-suspended');
        return;
      }
      if (isRateLimitMessage(message)) setIsRateLimited(true);
    }
  };

  /* ── Invite flow ── */
  if (isInviteFlow) {
    return (
      <AuthCampusBackdrop>
        <InvitationOnboardingShell
          centerVertically={false}
          withGlassStyle
          currentStep="login"
          title="Sign in to continue"
          description={
            inviteTenantDomain ? (
              <>
                Use the email and temporary password from your invitation. Institution:{' '}
                <span className="font-medium text-slate-800 dark:text-slate-100">{inviteTenantDomain}</span>
              </>
            ) : (
              'Use the email and temporary password from your invitation.'
            )
          }
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <input type="hidden" {...register('tenantDomain')} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} placeholder="john.doe@university.edu" className={AUTH_FORM_INPUT_CLASS} />
              {errors.email && <p className="text-sm text-destructive font-bold">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Temporary password</Label>
              <div className="relative">
                <Input id="password" type={isPasswordVisible ? 'text' : 'password'} {...register('password')} placeholder="••••••••" className={cn('pr-10', AUTH_FORM_INPUT_CLASS)} />
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setIsPasswordVisible((p) => !p)} aria-label={isPasswordVisible ? 'Hide password' : 'Show password'} className="absolute right-1 top-1/2 -translate-y-1/2">
                  {isPasswordVisible ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              {errors.password && <p className="text-sm text-destructive font-bold">{errors.password.message}</p>}
            </div>
            {error && <Alert variant="destructive" className="rounded-xl"><AlertDescription className="font-bold">{error}</AlertDescription></Alert>}
            <Button type="submit" className={AUTH_PRIMARY_BUTTON_CLASS} disabled={isLoading || isRateLimited}>
              {isLoading ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />SIGNING IN...</span> : 'SIGN IN'}
            </Button>
          </form>
        </InvitationOnboardingShell>
      </AuthCampusBackdrop>
    );
  }

  /* ── Main sign-in page ── */
  return (
    <div className="min-h-screen bg-slate-200 px-4 py-6 md:px-8 md:py-10">
      <motion.div
        className="mx-auto w-full max-w-5xl"
        variants={AUTH_CONTAINER_VARIANTS}
        initial="hidden"
        animate="visible"
      >
        <AuthTiltCard>
          <div className="grid min-h-[730px] overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl md:grid-cols-2">
            <div className="flex flex-col bg-white px-7 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
            <motion.div variants={AUTH_ITEM_VARIANTS} className="mb-10 flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <Image
                  src="/haramaya.png"
                  alt="Haramaya University"
                  fill
                  sizes="36px"
                  className="object-contain p-1"
                  priority
                />
              </div>
              <p className="text-lg font-semibold text-slate-900">Academia</p>
            </motion.div>

              <motion.div variants={AUTH_ITEM_VARIANTS} className="mb-8 space-y-2">
                <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Welcome to Academia</h1>
                <p className="max-w-md text-sm leading-6 text-slate-600">
                  The next generation of academic project management.
                </p>
              </motion.div>

            {tenantDomain && (
              <motion.div variants={AUTH_ITEM_VARIANTS} className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-[#ED5F45]/20 bg-[#ED5F45]/8 px-4 py-1.5 text-xs font-medium text-[#ED5F45]">
                <span className="h-2 w-2 rounded-full bg-[#ED5F45]" />
                {tenantDomain}
              </motion.div>
            )}

            {user && (
              <motion.div variants={AUTH_ITEM_VARIANTS} className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ED5F45]/10 font-semibold text-[#ED5F45]">
                  {(user.firstName?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
                </div>
                <p className="truncate font-medium">{[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email}</p>
                <Button variant="ghost" size="sm" onClick={() => logout()} className="ml-auto h-8 rounded-md px-3 text-xs text-slate-600 hover:bg-slate-200">
                  Logout
                </Button>
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <motion.div className="space-y-2" variants={AUTH_ITEM_VARIANTS}>
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="Enter your email"
                    className={cn(AUTH_FORM_INPUT_CLASS, 'h-12 rounded-xl border-slate-300 pl-10 text-sm')}
                  />
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p className="text-xs font-medium text-destructive" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {errors.email.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div className="space-y-2" variants={AUTH_ITEM_VARIANTS}>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                  <Link href={forgotPasswordHref} className="text-xs font-medium text-[#ED5F45] hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="Enter your password"
                    className={cn(AUTH_FORM_INPUT_CLASS, 'h-12 rounded-xl border-slate-300 pl-10 pr-11 text-sm')}
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                  >
                    {isPasswordVisible ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                <AnimatePresence>
                  {errors.password && (
                    <motion.p className="text-xs font-medium text-destructive" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {errors.password.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <Alert variant="destructive" className="rounded-xl py-2.5">
                      <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div variants={AUTH_ITEM_VARIANTS} className="pt-1">
                <Button
                  type="submit"
                  className={cn(AUTH_PRIMARY_BUTTON_CLASS, 'h-12 w-full rounded-xl text-sm font-semibold')}
                  disabled={isLoading || isRateLimited}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing In...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Sign In
                      <ArrowRight className="h-4.5 w-4.5" />
                    </span>
                  )}
                </Button>
              </motion.div>
            </form>

            <motion.p variants={AUTH_ITEM_VARIANTS} className="mt-8 text-center text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold text-[#ED5F45] hover:underline">
                Sign Up
              </Link>
            </motion.p>
            </div>

            <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#B84530] via-[#D95840] to-[#ED5F45] p-10 text-white md:flex md:flex-col md:justify-between lg:p-14">
              <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
              <div className="pointer-events-none absolute -left-20 bottom-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

              <motion.div variants={AUTH_ITEM_VARIANTS} className="relative z-10 mt-10 space-y-6">
                <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <CheckCircle2 className="h-5 w-5 text-white/90" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Capabilities</h2>
                  </div>
                  <ul className="space-y-3">
                    {capabilities.map((text) => (
                      <li key={text} className="flex items-start gap-3 text-sm leading-6 text-white/90">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/80" aria-hidden />
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <BarChart3 className="h-5 w-5 text-white/90" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Project Analytics</h3>
                  </div>
                  <p className="text-sm leading-6 text-white/90">
                    Monitor progress, track deadlines, and generate institutional insights with advanced reporting.
                  </p>
                </div>
              </motion.div>

              <motion.div variants={AUTH_ITEM_VARIANTS} className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">Used by teams at</p>
                  <div className="h-px flex-1 bg-white/30" />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm font-medium text-white/90 lg:grid-cols-3">
                  <span>Department Level</span>
                  <span>Final Year Student</span>
                  <span>Advisor</span>
                  <span>Coordinator</span>
                  <span>Evaluator</span>
                  <span>Admin</span>
                </div>
              </motion.div>
            </div>
          </div>
        </AuthTiltCard>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthCampusBackdrop>
          <p className="text-sm font-medium text-slate-600">Loading…</p>
        </AuthCampusBackdrop>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}