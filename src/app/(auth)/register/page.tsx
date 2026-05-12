'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  Building2,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { DEPARTMENT_NAME_OPTIONS, registerInstitutionSchema, RegisterInstitutionFormData } from '@/validations/auth';
import {
  AUTH_FORM_COLUMN_WRAP,
  AUTH_FORM_INPUT_CLASS,
  AUTH_MARKETING_COLUMN_WRAP,
  AUTH_PAGE_WRAP,
  AUTH_PRIMARY_BUTTON_CLASS,
  AUTH_SPLIT_CARD_GRID,
} from '@/components/auth/auth-campus-backdrop';
import { cn } from '@/lib/utils';
import {
  AuthTiltCard,
  AUTH_CONTAINER_VARIANTS,
  AUTH_ITEM_VARIANTS,
} from '@/components/auth/auth-tilt-card';

export default function RegisterPage() {
  const router = useRouter();
  const { registerInstitution, isLoading, error, clearError } = useAuthStore();
  const [successMessage, setSuccessMessage] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

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
      setSuccessMessage(`Registration submitted! Check ${data.email} for verify code.`);
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
    ]);
    if (valid) setStep(2);
  };

  const stepChipClass = (active: boolean) =>
    cn(
      'rounded-full px-3 py-1 text-xs font-semibold transition-all duration-300',
      active
        ? 'bg-[#ED5F45] text-white'
        : 'border border-slate-300 bg-slate-100 text-slate-500'
    );

  return (
    <div className={AUTH_PAGE_WRAP}>
      <motion.div
        className="mx-auto w-full max-w-5xl"
        variants={AUTH_CONTAINER_VARIANTS}
        initial="hidden"
        animate="visible"
      >
        <AuthTiltCard>
          <div className={AUTH_SPLIT_CARD_GRID}>
            <div className={AUTH_FORM_COLUMN_WRAP}>
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
                <h1 className="text-balance text-2xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Join Academia</h1>
                <p className="max-w-md text-sm leading-6 text-slate-600">
                  Transform your institution with the next generation of academic management.
                </p>
              </motion.div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <input type="hidden" {...register('universityName')} />

                <motion.div variants={AUTH_ITEM_VARIANTS} className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className={stepChipClass(step === 1)}>1. Department</span>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                  <span className={stepChipClass(step === 2)}>2. Account</span>
                </motion.div>

                <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.div
                      key="step1"
                      className="space-y-5"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="departmentName" className="text-sm font-medium text-slate-700">Department Name</Label>
                        <select
                          id="departmentName"
                          {...register('departmentName')}
                          className={cn(AUTH_FORM_INPUT_CLASS, 'h-12 w-full rounded-xl px-3 text-sm')}
                        >
                          <option value="" disabled>Select Department</option>
                          {DEPARTMENT_NAME_OPTIONS.map((name) => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                        {errors.departmentName && <p className="text-xs font-medium text-destructive">{errors.departmentName.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="departmentCode" className="text-sm font-medium text-slate-700">Department Code</Label>
                        <Input
                          id="departmentCode"
                          {...register('departmentCode')}
                          placeholder="e.g. CS, SWE, IS"
                          className={cn(AUTH_FORM_INPUT_CLASS, 'h-12 rounded-xl')}
                        />
                        {errors.departmentCode && <p className="text-xs font-medium text-destructive">{errors.departmentCode.message}</p>}
                      </div>

                      <Button
                        type="button"
                        className={cn(AUTH_PRIMARY_BUTTON_CLASS, 'h-12 rounded-xl text-sm font-semibold')}
                        onClick={() => void goToStep2()}
                      >
                        <span className="flex items-center justify-center gap-2">
                          Next
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="step2"
                      className="space-y-5"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">First Name</Label>
                          <Input id="firstName" {...register('firstName')} placeholder="John" className={cn(AUTH_FORM_INPUT_CLASS, 'h-12 rounded-xl')} />
                          {errors.firstName && <p className="text-xs font-medium text-destructive">{errors.firstName.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">Last Name</Label>
                          <Input id="lastName" {...register('lastName')} placeholder="Doe" className={cn(AUTH_FORM_INPUT_CLASS, 'h-12 rounded-xl')} />
                          {errors.lastName && <p className="text-xs font-medium text-destructive">{errors.lastName.message}</p>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-slate-700">Work Email</Label>
                        <Input id="email" type="email" {...register('email')} placeholder="admin@haramaya.edu" className={cn(AUTH_FORM_INPUT_CLASS, 'h-12 rounded-xl')} />
                        {errors.email && <p className="text-xs font-medium text-destructive">{errors.email.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                        <div className="flex items-center gap-2">
                        <div className="relative min-w-0 flex-1">
                          <Input
                            id="password"
                            {...register('password')}
                            type={isPasswordVisible ? 'text' : 'password'}
                            placeholder="Enter your password"
                            autoComplete="new-password"
                            className={cn(AUTH_FORM_INPUT_CLASS, 'h-12 rounded-xl pr-3')}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setIsPasswordVisible((p) => !p)}
                          aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                          className="shrink-0 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                        >
                          {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                        {errors.password && <p className="text-xs font-medium text-destructive">{errors.password.message}</p>}
                      </div>

                      <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 rounded-xl border-slate-300 text-sm font-medium text-slate-700 sm:flex-1"
                          onClick={() => { clearError(); setStep(1); }}
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          className={cn(AUTH_PRIMARY_BUTTON_CLASS, 'h-12 rounded-xl text-sm font-semibold sm:flex-[2]')}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Creating...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              Finish Setup
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <Alert variant="destructive" className="rounded-xl py-2.5">
                    <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 py-2.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription className="text-xs font-medium">{successMessage}</AlertDescription>
                  </Alert>
                )}
              </form>

              <motion.p variants={AUTH_ITEM_VARIANTS} className="mt-8 text-center text-sm text-slate-600">
                Already have a Department Head account?{' '}
                <Link href="/login" className="font-semibold text-[#ED5F45] hover:underline">
                  Sign in
                </Link>
              </motion.p>
            </div>

            <div className={AUTH_MARKETING_COLUMN_WRAP}>
              <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
              <div className="pointer-events-none absolute -left-20 bottom-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

              <motion.div variants={AUTH_ITEM_VARIANTS} className="relative z-10 mt-6 space-y-5 md:mt-10 md:space-y-6">
                <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <CheckCircle2 className="h-5 w-5 text-white/90" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Institutional Benefits</h2>
                  </div>
                  <ul className="space-y-3">
                    {[
                      'Department-based onboarding',
                      'Secure admin account bootstrap',
                      'Role-based workspace structure',
                      'Smart milestone governance',
                      'University-scale analytics',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm leading-6 text-white/90">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/80" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <GraduationCap className="h-5 w-5 text-white/90" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Department-Led Success</h3>
                  </div>
                  <p className="text-sm leading-6 text-white/90">
                    Track project progress, supervision quality, and milestone completion from one dashboard.
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
