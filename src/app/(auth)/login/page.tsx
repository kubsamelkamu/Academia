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
  AUTH_ACCENT_TEXT,
  AUTH_FORM_INPUT_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  AUTH_WELCOME_HEADLINE_CLASS,
  SIGN_IN_LOGO_SURFACE,
} from '@/components/auth/auth-campus-backdrop';
import { cn } from '@/lib/utils';
import { readInviteAcceptResult } from '@/lib/auth/invite-onboarding-storage';

/* ── Motion variants ── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const slideLeft = {
  hidden: { opacity: 0, x: -28 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const slideRight = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

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
  const inviteEmailPrefill = useMemo(() => {
    if (!isInviteFlow) return '';
    return readInviteAcceptResult()?.result.email ?? '';
  }, [isInviteFlow]);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [logoOk, setLogoOk] = useState(true);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    defaultValues: { email: inviteEmailPrefill, password: '' },
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
            tenantDomain ? (
              <>
                Use the email and temporary password from your invitation. Institution:{' '}
                <span className="font-medium text-slate-800 dark:text-slate-100">{tenantDomain}</span>
              </>
            ) : (
              'Use the email and temporary password from your invitation.'
            )
          }
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} placeholder="john.doe@university.edu" className={AUTH_FORM_INPUT_CLASS} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Temporary password</Label>
              <div className="relative">
                <Input id="password" type={isPasswordVisible ? 'text' : 'password'} {...register('password')} placeholder="••••••••" className={cn('pr-10', AUTH_FORM_INPUT_CLASS)} />
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setIsPasswordVisible((p) => !p)} aria-label={isPasswordVisible ? 'Hide password' : 'Show password'} className="absolute right-1 top-1/2 -translate-y-1/2">
                  {isPasswordVisible ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <Button type="submit" className={AUTH_PRIMARY_BUTTON_CLASS} disabled={isLoading || isRateLimited}>
              {isLoading ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Signing in...</span> : 'Sign in'}
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
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Hero headline ── */}
        <motion.div className="mb-10 text-center sm:mb-12" variants={itemVariants}>
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
              <Building2 className="h-10 w-10 text-emerald-600 sm:h-11 sm:w-11 dark:text-emerald-400" aria-hidden />
            )}
          </motion.div>

          <h1 className={cn('mb-3 text-4xl sm:text-5xl md:text-6xl', AUTH_WELCOME_HEADLINE_CLASS)}>
            Welcome back
          </h1>
          <p className="mx-auto max-w-lg text-pretty text-base text-white/85 drop-shadow-sm sm:text-lg">
            Access your institution&apos;s academic management dashboard
          </p>


        </motion.div>

        {/* ── Two-column grid ── */}
        <div className="grid items-stretch gap-5 sm:gap-6 lg:grid-cols-[1fr_420px] lg:gap-8">

          {/* ── Left: features + analytics ── */}
          <motion.div className="order-2 space-y-4 sm:space-y-5 lg:order-1" variants={slideLeft}>

            {/* Features card */}
            <div className="group relative overflow-hidden rounded-2xl border border-[#E84813]/20 bg-slate-900/40 p-5 shadow-xl backdrop-blur-xl sm:p-6 dark:border-[#E84813]/20 dark:bg-slate-900/60">
              {/* top edge accent */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-[#E84813] opacity-90" />
              <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-white sm:text-lg">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E84813]/20 border border-[#E84813]/30">
                  <GraduationCap className="h-4 w-4 text-[#E84813]" />
                </span>
                Platform features
              </h3>
              <ul className="space-y-2.5">
                {features.map(({ icon: Icon, text }, i) => (
                  <motion.li
                    key={text}
                    className="flex items-start gap-3 text-sm text-slate-100 sm:text-[0.9375rem]"
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 + i * 0.07 }}
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E84813]/20 border border-[#E84813]/30">
                      <Icon className="h-3 w-3 text-[#E84813]" />
                    </span>
                    {text}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Analytics card */}
            <div className="group relative overflow-hidden rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-900/88 via-green-900/82 to-teal-900/80 p-5 text-white backdrop-blur-xl sm:p-6">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 opacity-80" />
              {/* Subtle grid pattern */}
              <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} aria-hidden />
              <div className="relative z-[1]">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/25 sm:h-10 sm:w-10">
                  <BarChart3 className="h-5 w-5 text-emerald-300" />
                </div>
                <h3 className="mb-1.5 text-base font-bold sm:text-lg">Powerful analytics</h3>
                <p className="text-sm leading-relaxed text-white/80 sm:text-[0.9375rem]">
                  Get deep insights into your institution&apos;s academic performance with real-time
                  reporting tools and visual dashboards.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── Right: form card ── */}
          <motion.div 
            className="order-1 lg:order-2" 
            variants={slideRight}
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="relative overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_20px_60px_-15px_rgba(16,185,129,0.25)] backdrop-blur-2xl dark:border-emerald-500/20 dark:bg-slate-900/95">
              {/* top emerald accent stripe */}
              <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />

              <div className="px-6 pb-7 pt-6 sm:px-8 sm:pb-8 sm:pt-7">
                {/* Card header */}
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                    <LogIn className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-100">Sign in</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Access your academic institution dashboard
                  </p>
                  {tenantDomain && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/30 dark:text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {tenantDomain}
                    </div>
                  )}
                  {user && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <span>Signed in as <strong>{user.firstName} {user.lastName}</strong></span>
                      <Button variant="outline" size="sm" onClick={() => logout()} className="ml-1 h-6 rounded-full px-2.5 text-xs">Logout</Button>
                    </div>
                  )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
                  {/* Email */}
                  <motion.div className="space-y-1.5" variants={itemVariants}>
                    <Label htmlFor="email" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      <Mail className={cn('h-3.5 w-3.5 shrink-0', AUTH_ACCENT_ICON)} />
                      Email address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="john.doe@university.edu"
                      className={AUTH_FORM_INPUT_CLASS}
                    />
                    <AnimatePresence>
                      {errors.email && (
                        <motion.p
                          className="text-xs font-medium text-destructive"
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
                  <motion.div className="space-y-1.5" variants={itemVariants}>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        <Lock className={cn('h-3.5 w-3.5 shrink-0', AUTH_ACCENT_ICON)} />
                        Password
                      </Label>
                      <Link
                        href={forgotPasswordHref}
                        className="text-xs font-medium text-emerald-600 underline-offset-3 transition-colors hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={isPasswordVisible ? 'text' : 'password'}
                        {...register('password')}
                        placeholder="••••••••"
                        className={cn('pr-10', AUTH_FORM_INPUT_CLASS)}
                      />
                      <button
                        type="button"
                        onClick={() => setIsPasswordVisible((p) => !p)}
                        aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <AnimatePresence>
                      {errors.password && (
                        <motion.p
                          className="text-xs font-medium text-destructive"
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
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      type="submit"
                      className={AUTH_PRIMARY_BUTTON_CLASS}
                      disabled={isLoading || isRateLimited}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Signing in…
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Sign in
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </form>

                {/* Footer */}
                <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="font-semibold text-emerald-600 underline-offset-3 hover:underline dark:text-emerald-400">
                    Create one free
                  </Link>
                </p>
              </div>
            </div>
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