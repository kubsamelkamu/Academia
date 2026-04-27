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
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Building2,
  ShieldCheck,
  Users,
  CalendarCheck,
  GraduationCap,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { loginSchema, LoginFormData } from '@/validations/auth';
import { getDashboardRoleSlug, getPrimaryRoleFromBackendRoles } from '@/lib/auth/dashboard-role-paths';
import { DEFAULT_RATE_LIMIT_RETRY_AFTER_MS, getErrorMessage, isRateLimitMessage } from '@/lib/api/errors';
import { InvitationOnboardingShell } from '@/components/auth/invitation-onboarding-shell';
import {
  AuthCampusBackdrop,
  AUTH_ACCENT_ICON,
  AUTH_FORM_INPUT_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  AUTH_WELCOME_HEADLINE_CLASS,
  SIGN_IN_LOGO_SURFACE,
} from '@/components/auth/auth-campus-backdrop';
import { cn } from '@/lib/utils';
import { clearInviteAcceptResult, readInviteAcceptResult } from '@/lib/auth/invite-onboarding-storage';
import {
  AuthTiltCard,
  AUTH_CONTAINER_VARIANTS,
  AUTH_ITEM_VARIANTS,
  AUTH_SLIDE_LEFT_VARIANTS,
  AUTH_SLIDE_RIGHT_VARIANTS,
} from '@/components/auth/auth-tilt-card';

/* ── Feature bullets ── */
const features = [
  { icon: CheckCircle2,  text: 'Real-time project tracking & management' },
  { icon: CalendarCheck, text: 'Automated defense scheduling system' },
  { icon: Users,         text: 'Multi-role user management' },
  { icon: BarChart3,     text: 'Comprehensive reporting & analytics' },
  { icon: ShieldCheck,   text: 'Secure multi-tenant architecture' },
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
  const [logoOk, setLogoOk] = useState(true);
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
    <AuthCampusBackdrop>
      <motion.div
        className="mx-auto w-full max-w-6xl"
        variants={AUTH_CONTAINER_VARIANTS}
        initial="hidden"
        animate="visible"
      >
        {/* ── Hero headline ── */}
        <motion.div className="mb-10 text-center sm:mb-12" variants={AUTH_ITEM_VARIANTS}>
          {/* Logo badge */}
          <motion.div
            className={cn(
              'relative mx-auto mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl sm:h-24 sm:w-24',
              SIGN_IN_LOGO_SURFACE
            )}
            whileHover={{ scale: 1.06, rotate: -3 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            {logoOk ? (
              <Image src="/haramaya.png" alt="Haramaya University" fill sizes="(max-width: 640px) 80px, 96px" className="object-contain p-2.5 sm:p-3" priority onError={() => setLogoOk(false)} />
            ) : (
              <Building2 className="h-10 w-10 text-[#ED5F45] sm:h-11 sm:w-11" aria-hidden />
            )}
          </motion.div>

          <h1 className={cn('mb-3 text-4xl sm:text-5xl md:text-6xl', AUTH_WELCOME_HEADLINE_CLASS)}>
            Welcome to Academia
          </h1>
          <p className="mx-auto max-w-lg text-pretty text-base text-white/90 drop-shadow-sm sm:text-lg font-medium">
            The next generation of academic project management.
          </p>
        </motion.div>

        {/* ── Two-column grid ── */}
        <div className="grid items-stretch gap-8 lg:grid-cols-[1fr_420px]">

          {/* ── Left: features + info ── */}
          <motion.div className="order-2 space-y-6 lg:order-1" variants={AUTH_SLIDE_LEFT_VARIANTS}>
            {/* Features card */}
            <AuthTiltCard>
              <div className="group relative overflow-hidden rounded-[2.5rem] border border-[#ED5F45]/20 bg-slate-950/40 p-8 shadow-2xl backdrop-blur-xl">
                {/* top edge accent */}
                <div className="absolute inset-x-0 top-0 h-1 bg-[#ED5F45] opacity-90" />
                <h3 className="mb-6 flex items-center gap-3 text-lg font-black text-white sm:text-xl uppercase tracking-tight">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ED5F45]/20 border border-[#ED5F45]/30">
                    <GraduationCap className="h-5 w-5 text-[#ED5F45]" />
                  </span>
                  Capabilities
                </h3>
                <ul className="space-y-4">
                  {features.map(({ icon: Icon, text }, i) => (
                    <motion.li
                      key={text}
                      className="flex items-start gap-4 text-sm text-slate-100 sm:text-base font-medium"
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.18 + i * 0.07 }}
                    >
                      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ED5F45]/20 border border-[#ED5F45]/30">
                        <Icon className="h-3.5 w-3.5 text-[#ED5F45]" />
                      </span>
                      {text}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </AuthTiltCard>

            {/* Info card */}
            <AuthTiltCard>
              <div className="group relative overflow-hidden rounded-[2.5rem] border border-[#ED5F45]/20 bg-gradient-to-br from-[#ED5F45]/10 via-slate-900/40 to-slate-950/80 p-8 text-white backdrop-blur-xl">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ED5F45] via-[#F47A64] to-[#ED5F45] opacity-80" />
                <div className="relative z-[1]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#ED5F45]/30 ring-4 ring-[#ED5F45]/10">
                    <BarChart3 className="h-6 w-6 text-[#ED5F45]" />
                  </div>
                  <h3 className="mb-2 text-lg font-black sm:text-xl uppercase tracking-tight">Project Analytics</h3>
                  <p className="text-sm leading-relaxed text-white/80 sm:text-base font-medium">
                    Monitor progress, track deadlines, and generate institutional insights with our advanced reporting engine.
                  </p>
                </div>
              </div>
            </AuthTiltCard>
          </motion.div>

          {/* ── Right: form card ── */}
          <motion.div className="order-1 lg:order-2" variants={AUTH_SLIDE_RIGHT_VARIANTS}>
            <AuthTiltCard>
              <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white dark:bg-slate-900 shadow-2xl backdrop-blur-2xl">
                {/* top accent stripe */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[#ED5F45] via-[#F47A64] to-[#ED5F45]" />

                <div className="px-6 pb-10 pt-8 sm:px-10">
                  {/* Card header */}
                  <div className="mb-8 text-center">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ED5F45] to-[#F47A64] shadow-lg shadow-[#ED5F45]/30">
                      <LogIn className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 sm:text-3xl dark:text-slate-100 uppercase tracking-tight">Sign In</h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium text-pretty leading-snug">
                      Authenticate to access your academic workspace
                    </p>
                    {tenantDomain && (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#ED5F45]/20 bg-[#ED5F45]/5 px-4 py-1.5 text-xs font-black text-[#ED5F45] uppercase tracking-wider">
                        <span className="h-2 w-2 rounded-full bg-[#ED5F45] animate-pulse" />
                        {tenantDomain}
                      </div>
                    )}
                    {user && (
                      <div className="mt-5 flex items-center justify-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                         <div className="h-8 w-8 rounded-full bg-[#ED5F45]/10 flex items-center justify-center text-[#ED5F45] font-bold">
                            {(user.firstName?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
                         </div>
                        <span><strong>{[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email}</strong></span>
                        <Button variant="ghost" size="sm" onClick={() => logout()} className="h-8 rounded-xl px-3 text-xs font-bold text-[#ED5F45] hover:bg-[#ED5F45]/10">Logout</Button>
                      </div>
                    )}
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Email */}
                    <motion.div className="space-y-2" variants={AUTH_ITEM_VARIANTS}>
                      <Label htmlFor="email" className="flex items-center gap-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        <Mail className={cn('h-3.5 w-3.5 shrink-0', AUTH_ACCENT_ICON)} />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        placeholder="email@university.edu"
                        className={cn(AUTH_FORM_INPUT_CLASS, "h-12 rounded-xl border-2")}
                      />
                      <AnimatePresence>
                        {errors.email && (
                          <motion.p
                            className="text-[11px] font-bold text-destructive px-1"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                          >
                            {errors.email.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Password */}
                    <motion.div className="space-y-2" variants={AUTH_ITEM_VARIANTS}>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="flex items-center gap-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          <Lock className={cn('h-3.5 w-3.5 shrink-0', AUTH_ACCENT_ICON)} />
                          Password
                        </Label>
                        <Link
                          href={forgotPasswordHref}
                          className="text-[10px] font-black text-[#ED5F45] transition-colors hover:underline uppercase"
                        >
                          Forgot?
                        </Link>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={isPasswordVisible ? 'text' : 'password'}
                          {...register('password')}
                          placeholder="••••••••"
                          className={cn('pr-12 h-12 rounded-xl border-2', AUTH_FORM_INPUT_CLASS)}
                        />
                        <button
                          type="button"
                          onClick={() => setIsPasswordVisible((p) => !p)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-[#ED5F45]"
                        >
                          {isPasswordVisible ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                      </div>
                      <AnimatePresence>
                        {errors.password && (
                          <motion.p
                            className="text-[11px] font-bold text-destructive px-1"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                          >
                            {errors.password.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Error alert */}
                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                          <Alert variant="destructive" className="rounded-xl border-[#ED5F45]/20 bg-[#ED5F45]/5 text-[#ED5F45] py-2 px-3">
                            <AlertDescription className="text-xs font-bold">{error}</AlertDescription>
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit */}
                    <motion.div variants={AUTH_ITEM_VARIANTS} className="pt-2">
                      <Button
                        type="submit"
                        className={cn(AUTH_PRIMARY_BUTTON_CLASS, "h-14 text-base font-black uppercase tracking-widest")}
                        disabled={isLoading || isRateLimited}
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            AUTHENTICATING...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-3">
                            Sign In
                            <ArrowRight className="h-5 w-5" />
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  </form>

                </div>
              </div>
            </AuthTiltCard>
          </motion.div>
        </div>
      </motion.div>
    </AuthCampusBackdrop>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthCampusBackdrop>
          <p className="text-sm font-medium text-white/90 drop-shadow">Loading…</p>
        </AuthCampusBackdrop>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}