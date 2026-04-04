'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  AUTH_CTA_CARD_CLASS,
  AUTH_FORM_INPUT_CLASS,
  AUTH_GLASS_FORM,
  AUTH_GLASS_PANEL,
  AUTH_PRIMARY_BUTTON_CLASS,
  AUTH_WELCOME_HEADLINE_CLASS,
  SIGN_IN_LOGO_SURFACE,
  SIGN_IN_MAGIC_AURA,
  SIGN_IN_MAGIC_CARD_SHELL,
  SIGN_IN_MAGIC_HOVER,
  SIGN_IN_MAGIC_SHINE,
} from '@/components/auth/auth-campus-backdrop';
import { cn } from '@/lib/utils';
import { readInviteAcceptResult } from '@/lib/auth/invite-onboarding-storage';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

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
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
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
    },
  });

  const emailValue = useWatch({ control, name: 'email' }) ?? '';
  const forgotPasswordHref = emailValue.trim()
    ? `/forgot-password?email=${encodeURIComponent(emailValue.trim())}`
    : '/forgot-password';

  const redirectToDashboard = useCallback((userRoles?: string[]) => {
    const primaryRole = getPrimaryRoleFromBackendRoles(userRoles);
    if (primaryRole) {
      router.push(`/dashboard/${getDashboardRoleSlug(primaryRole)}`);
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  useEffect(() => {
    if (user && user.mustChangePassword) {
      router.push(isInviteFlow ? "/change-password?from=invite" : "/change-password")
      return
    }

    // Allow authenticated users to see the login page
    // redirectToDashboard(user.roles);
  }, [isInviteFlow, router, user, redirectToDashboard]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      await login(data);

      const state = useAuthStore.getState();
      if (state.user?.mustChangePassword) {
        router.push(isInviteFlow ? "/change-password?from=invite" : "/change-password")
        return
      }
      redirectToDashboard(state.user?.roles);
    } catch (e: unknown) {
      const message = getErrorMessage(e, '');
      if (message === 'account is not active') {
        router.push('/account-suspended');
        return;
      }
      if (isRateLimitMessage(message)) {
        setIsRateLimited(true);
      }
      // Error handled by store
    }
  };

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
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="john.doe@university.edu"
                className={AUTH_FORM_INPUT_CLASS}
              />
              {errors.email ? (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Temporary password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className={cn('pr-10', AUTH_FORM_INPUT_CLASS)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIsPasswordVisible((prev) => !prev)}
                  aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                >
                  {isPasswordVisible ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              {errors.password ? (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              ) : null}
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="submit"
              className={AUTH_PRIMARY_BUTTON_CLASS}
              disabled={isLoading || isRateLimited}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </InvitationOnboardingShell>
      </AuthCampusBackdrop>
    );
  }

  return (
    <AuthCampusBackdrop>
      <motion.div
        className="mx-auto w-full max-w-5xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="mb-8 text-center sm:mb-10" variants={itemVariants}>
          <motion.div
            className={cn(
              'relative mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full sm:h-24 sm:w-24',
              SIGN_IN_LOGO_SURFACE
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {logoOk ? (
              <Image
                src="/haramaya.png"
                alt="Haramaya University"
                fill
                sizes="(max-width: 640px) 80px, 96px"
                className="object-contain p-2.5 sm:p-3"
                priority
                onError={() => setLogoOk(false)}
              />
            ) : (
              <Building2
                className="h-10 w-10 text-emerald-600 drop-shadow-sm sm:h-11 sm:w-11 dark:text-emerald-400"
                aria-hidden
              />
            )}
          </motion.div>
          <h1
            className={cn(
              'mb-2 text-3xl sm:text-4xl md:text-5xl',
              AUTH_WELCOME_HEADLINE_CLASS
            )}
          >
            Welcome back
          </h1>
          <p className="mx-auto max-w-xl text-pretty text-base text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)] sm:text-lg md:text-xl md:leading-relaxed">
            Access your institution&apos;s academic management dashboard
          </p>
        </motion.div>

        <div className="grid items-stretch gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-10">
          <motion.div className="order-2 space-y-5 sm:space-y-6 lg:order-1" variants={itemVariants}>
            <motion.div
              className={cn(SIGN_IN_MAGIC_CARD_SHELL, AUTH_GLASS_PANEL, 'p-5 sm:p-6')}
              whileHover={SIGN_IN_MAGIC_HOVER}
            >
              <div className={SIGN_IN_MAGIC_AURA} aria-hidden />
              <div className="relative z-[1]">
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900 sm:text-lg dark:text-slate-100">
                  <CheckCircle2 className={cn('h-5 w-5 shrink-0', AUTH_ACCENT_ICON)} />
                  Dashboard features
                </h3>
                <ul className="space-y-3 text-sm sm:text-base">
                  {[
                    'Real-time project tracking and management',
                    'Automated defense scheduling system',
                    'Multi-role user management',
                    'Comprehensive reporting and analytics',
                    'Secure multi-tenant architecture',
                  ].map((feature, index) => (
                    <motion.li
                      key={feature}
                      className="flex gap-3 text-slate-700 dark:text-slate-200"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + index * 0.08 }}
                    >
                      <CheckCircle2 className={cn('mt-0.5 h-4 w-4 shrink-0', AUTH_ACCENT_ICON)} />
                      {feature}
                    </motion.li>
                  ))}
                </ul>
              </div>
              <div className={SIGN_IN_MAGIC_SHINE} aria-hidden />
            </motion.div>

            <motion.div
              className={cn(SIGN_IN_MAGIC_CARD_SHELL, AUTH_CTA_CARD_CLASS)}
              whileHover={SIGN_IN_MAGIC_HOVER}
            >
              <div className={SIGN_IN_MAGIC_AURA} aria-hidden />
              <div className="relative z-[1]">
                <BarChart3 className="mb-3 h-7 w-7 sm:h-8 sm:w-8" />
                <h3 className="mb-2 text-base font-semibold sm:text-lg">Powerful analytics</h3>
                <p className="text-sm leading-relaxed text-white/90 sm:text-base">
                  Get insights into your institution&apos;s academic performance with comprehensive
                  analytics and reporting tools.
                </p>
              </div>
              <div className={SIGN_IN_MAGIC_SHINE} aria-hidden />
            </motion.div>
          </motion.div>

          <motion.div className="order-1 lg:order-2" variants={itemVariants}>
            <motion.div
              className={cn(SIGN_IN_MAGIC_CARD_SHELL)}
              whileHover={SIGN_IN_MAGIC_HOVER}
            >
              <div className={SIGN_IN_MAGIC_AURA} aria-hidden />
              <Card className={cn(AUTH_GLASS_FORM, 'relative z-[1] gap-0 border-0 py-0 shadow-2xl ring-0')}>
              <CardHeader className="space-y-1 px-5 pb-4 pt-6 sm:px-6 sm:pt-8">
                <CardTitle className="flex items-center justify-center gap-2 text-center text-xl sm:text-2xl">
                  <LogIn className={cn('h-6 w-6 shrink-0', AUTH_ACCENT_ICON)} />
                  Sign in
                </CardTitle>
                <CardDescription className="text-center text-slate-600 dark:text-slate-300">
                  Access your academic institution dashboard
                  {tenantDomain ? (
                    <div className="mt-2 text-sm">
                      Institution:{' '}
                      <span className={cn('font-medium', AUTH_ACCENT_TEXT)}>{tenantDomain}</span>
                    </div>
                  ) : null}
                  {user ? (
                    <div className="mt-2 text-sm">
                      Signed in as:{' '}
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {user.firstName} {user.lastName}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => logout()}
                        className="ml-2 text-xs"
                      >
                        Logout
                      </Button>
                    </div>
                  ) : null}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-6 sm:px-6 sm:pb-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
                  <motion.div className="space-y-2" variants={itemVariants}>
                    <Label htmlFor="email" className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <Mail className={cn('h-4 w-4 shrink-0', AUTH_ACCENT_ICON)} />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="john.doe@university.edu"
                      className={AUTH_FORM_INPUT_CLASS}
                    />
                    {errors.email ? (
                      <motion.p
                        className="flex items-center gap-1 text-sm text-destructive"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {errors.email.message}
                      </motion.p>
                    ) : null}
                  </motion.div>

                  <motion.div className="space-y-2" variants={itemVariants}>
                    <Label htmlFor="password" className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <Lock className={cn('h-4 w-4 shrink-0', AUTH_ACCENT_ICON)} />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={isPasswordVisible ? 'text' : 'password'}
                        {...register('password')}
                        placeholder="••••••••"
                        className={cn('pr-10', AUTH_FORM_INPUT_CLASS)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setIsPasswordVisible((prev) => !prev)}
                        aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                      >
                        {isPasswordVisible ? <EyeOff /> : <Eye />}
                      </Button>
                    </div>
                    {errors.password ? (
                      <motion.p
                        className="flex items-center gap-1 text-sm text-destructive"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {errors.password.message}
                      </motion.p>
                    ) : null}

                    <div className="flex justify-end pt-0.5">
                      <Link
                        href={forgotPasswordHref}
                        className="text-sm text-slate-600 underline-offset-4 transition-colors hover:text-sky-600 hover:underline dark:text-slate-300 dark:hover:text-sky-400"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </motion.div>

                  {error ? (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  ) : null}

                  <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      type="submit"
                      className={AUTH_PRIMARY_BUTTON_CLASS}
                      disabled={isLoading || isRateLimited}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Signing in...
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
              </CardContent>
            </Card>
              <div className={SIGN_IN_MAGIC_SHINE} aria-hidden />
            </motion.div>
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
          <p className="text-sm font-medium text-white/90 drop-shadow">Loading...</p>
        </AuthCampusBackdrop>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}