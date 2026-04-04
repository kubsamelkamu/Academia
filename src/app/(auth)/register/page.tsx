'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Info,
  Building2,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { DEPARTMENT_NAME_OPTIONS, registerInstitutionSchema, RegisterInstitutionFormData } from '@/validations/auth';
import {
  AuthCampusBackdrop,
  AUTH_ACCENT_ICON,
  AUTH_CTA_CARD_CLASS,
  AUTH_FORM_INPUT_CLASS,
  AUTH_GLASS_FORM,
  AUTH_GLASS_PANEL,
  AUTH_WELCOME_HEADLINE_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  SIGN_IN_LOGO_SURFACE,
  SIGN_IN_MAGIC_AURA,
  SIGN_IN_MAGIC_CARD_SHELL,
  SIGN_IN_MAGIC_HOVER,
  SIGN_IN_MAGIC_SHINE,
} from '@/components/auth/auth-campus-backdrop';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function RegisterPage() {
  const router = useRouter();
  const { registerInstitution, isLoading, error, clearError } = useAuthStore();
  const [successMessage, setSuccessMessage] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [logoOk, setLogoOk] = useState(true);

  const DEFAULT_UNIVERSITY_NAME = 'Haramaya University';

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<RegisterInstitutionFormData>({
    resolver: zodResolver(registerInstitutionSchema),
    defaultValues: {
      universityName: DEFAULT_UNIVERSITY_NAME,
    },
  });

  const onSubmit = async (data: RegisterInstitutionFormData) => {
    try {
      clearError();
      await registerInstitution({
        ...data,
        universityName: DEFAULT_UNIVERSITY_NAME,
      });
      setSuccessMessage(`Registration submitted! Check ${data.email} for the verification code.`);
      setTimeout(() => {
        router.push('/register/verify');
      }, 2000);
    } catch {
      // Error is handled by the store
    }
  };

  const goToStep2 = async () => {
    clearError();
    const valid = await trigger([
      'universityName',
      'departmentName',
      'departmentCode',
      'departmentDescription',
    ]);
    if (valid) setStep(2);
  };

  const stepChipClass = (active: boolean) =>
    cn(
      'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm',
      active
        ? 'bg-sky-600 text-white shadow-md shadow-sky-950/20 dark:bg-sky-500'
        : 'bg-white/45 text-slate-600 ring-1 ring-white/50 backdrop-blur-sm dark:bg-slate-950/40 dark:text-slate-200'
    );

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
          <h1 className={cn('mb-2 text-3xl sm:text-4xl md:text-5xl', AUTH_WELCOME_HEADLINE_CLASS)}>
            Join Academia
          </h1>
          <p className="mx-auto max-w-xl text-pretty text-base text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)] sm:text-lg md:text-xl md:leading-relaxed">
            Transform your institution with our academic management platform
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
                  Why choose Academia?
                </h3>
                <ul className="space-y-3 text-sm sm:text-base">
                  {[
                    'Streamlined project management',
                    'Automated defense scheduling',
                    'Real-time progress tracking',
                    'Multi-role dashboard access',
                    'Secure multi-tenant architecture',
                  ].map((benefit, index) => (
                    <motion.li
                      key={benefit}
                      className="flex gap-3 text-slate-700 dark:text-slate-200"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + index * 0.08 }}
                    >
                      <CheckCircle2 className={cn('mt-0.5 h-4 w-4 shrink-0', AUTH_ACCENT_ICON)} />
                      {benefit}
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
                <GraduationCap className="mb-3 h-7 w-7 sm:h-8 sm:w-8" />
                <h3 className="mb-2 text-base font-semibold sm:text-lg">Ready to get started?</h3>
                <p className="text-sm leading-relaxed text-white/90 sm:text-base">
                  Join institutions already using Academia to manage academic projects efficiently.
                </p>
              </div>
              <div className={SIGN_IN_MAGIC_SHINE} aria-hidden />
            </motion.div>
          </motion.div>

          <motion.div className="order-1 lg:order-2" variants={itemVariants}>
            <motion.div className={SIGN_IN_MAGIC_CARD_SHELL} whileHover={SIGN_IN_MAGIC_HOVER}>
              <div className={SIGN_IN_MAGIC_AURA} aria-hidden />
              <Card className={cn(AUTH_GLASS_FORM, 'relative z-[1] gap-0 border-0 py-0 shadow-2xl ring-0')}>
                <CardHeader className="space-y-3 px-5 pb-4 pt-6 sm:px-6 sm:pt-8">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                    <span className={stepChipClass(step === 1)}>1 · Department</span>
                    <ArrowRight className="hidden h-4 w-4 text-slate-400 sm:block" aria-hidden />
                    <span className={stepChipClass(step === 2)}>2 · Account</span>
                  </div>
                  <CardTitle className="flex items-center justify-center gap-2 text-center text-xl sm:text-2xl">
                    <GraduationCap className={cn('h-6 w-6 shrink-0', AUTH_ACCENT_ICON)} />
                    Register your department
                  </CardTitle>
                  <CardDescription className="text-center text-slate-600 dark:text-slate-300">
                    {step === 1
                      ? 'Choose your department and code (Haramaya University).'
                      : 'Create the department head account.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-5 pb-6 sm:px-6 sm:pb-8">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
                    <input type="hidden" {...register('universityName')} />

                    {step === 1 ? (
                      <motion.div
                        key="step1"
                        className="space-y-4"
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2 dark:border-slate-600/50">
                          <GraduationCap className={cn('h-4 w-4 shrink-0', AUTH_ACCENT_ICON)} />
                          <h4 className="font-semibold text-slate-800 dark:text-slate-100">Department details</h4>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="departmentName">Department name</Label>
                            <select
                              id="departmentName"
                              {...register('departmentName')}
                              defaultValue=""
                              className={cn(
                                AUTH_FORM_INPUT_CLASS,
                                'h-9 w-full rounded-md px-3 py-1 text-base md:text-sm'
                              )}
                              aria-invalid={errors.departmentName ? 'true' : 'false'}
                            >
                              <option value="" disabled>
                                Select a department
                              </option>
                              {DEPARTMENT_NAME_OPTIONS.map((name) => (
                                <option key={name} value={name}>
                                  {name}
                                </option>
                              ))}
                            </select>
                            {errors.departmentName ? (
                              <p className="text-sm text-destructive">{errors.departmentName.message}</p>
                            ) : null}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="departmentCode">Department code</Label>
                            <Input
                              id="departmentCode"
                              {...register('departmentCode')}
                              placeholder="CS"
                              className={AUTH_FORM_INPUT_CLASS}
                            />
                            {errors.departmentCode ? (
                              <p className="text-sm text-destructive">{errors.departmentCode.message}</p>
                            ) : null}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="departmentDescription">Department description (optional)</Label>
                          <Input
                            id="departmentDescription"
                            {...register('departmentDescription')}
                            placeholder="Brief description of the department"
                            className={AUTH_FORM_INPUT_CLASS}
                          />
                          {errors.departmentDescription ? (
                            <p className="text-sm text-destructive">{errors.departmentDescription.message}</p>
                          ) : null}
                        </div>

                        <Button
                          type="button"
                          className={AUTH_PRIMARY_BUTTON_CLASS}
                          onClick={() => void goToStep2()}
                        >
                          <span className="flex items-center justify-center gap-2">
                            Continue
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="step2"
                        className="space-y-4"
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2 dark:border-slate-600/50">
                          <User className={cn('h-4 w-4 shrink-0', AUTH_ACCENT_ICON)} />
                          <h4 className="font-semibold text-slate-800 dark:text-slate-100">Department head</h4>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First name</Label>
                            <Input
                              id="firstName"
                              {...register('firstName')}
                              placeholder="John"
                              className={AUTH_FORM_INPUT_CLASS}
                            />
                            {errors.firstName ? (
                              <p className="text-sm text-destructive">{errors.firstName.message}</p>
                            ) : null}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last name</Label>
                            <Input
                              id="lastName"
                              {...register('lastName')}
                              placeholder="Doe"
                              className={AUTH_FORM_INPUT_CLASS}
                            />
                            {errors.lastName ? (
                              <p className="text-sm text-destructive">{errors.lastName.message}</p>
                            ) : null}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2">
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
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password" className="flex items-center gap-2">
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
                              onClick={() => setIsPasswordVisible((p) => !p)}
                              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                              className="absolute right-1 top-1/2 -translate-y-1/2"
                            >
                              {isPasswordVisible ? <EyeOff /> : <Eye />}
                            </Button>
                          </div>
                          <p className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                            <Info className="h-3 w-3 shrink-0" />
                            Uppercase, lowercase, and a number required
                          </p>
                          {errors.password ? (
                            <p className="text-sm text-destructive">{errors.password.message}</p>
                          ) : null}
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full border-white/50 bg-white/30 backdrop-blur-sm sm:w-auto sm:min-w-[7rem]"
                            onClick={() => {
                              clearError();
                              setStep(1);
                            }}
                          >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                          </Button>
                          <Button
                            type="submit"
                            className={cn(AUTH_PRIMARY_BUTTON_CLASS, 'sm:flex-1')}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creating department…
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-2">
                                Register department
                                <ArrowRight className="h-4 w-4" />
                              </span>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {error ? (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ) : null}

                    {successMessage ? (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <AlertDescription>{successMessage}</AlertDescription>
                      </Alert>
                    ) : null}
                  </form>

                  <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
                    Already have an account?{' '}
                    <Link
                      href="/login"
                      className="font-medium text-sky-700 underline-offset-4 hover:text-sky-600 hover:underline dark:text-sky-400 dark:hover:text-sky-300"
                    >
                      Sign in
                    </Link>
                  </p>
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
