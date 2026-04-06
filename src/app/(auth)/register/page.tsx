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
  AUTH_FORM_INPUT_CLASS,
  AUTH_WELCOME_HEADLINE_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  SIGN_IN_LOGO_SURFACE,
} from '@/components/auth/auth-campus-backdrop';
import { cn } from '@/lib/utils';
import {
  AuthTiltCard,
  AUTH_CONTAINER_VARIANTS,
  AUTH_ITEM_VARIANTS,
  AUTH_SLIDE_LEFT_VARIANTS,
  AUTH_SLIDE_RIGHT_VARIANTS,
} from '@/components/auth/auth-tilt-card';

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
      'departmentDescription',
    ]);
    if (valid) setStep(2);
  };

  const stepChipClass = (active: boolean) =>
    cn(
      'rounded-full px-4 py-1.5 text-xs font-black transition-all duration-300 uppercase tracking-widest',
      active
        ? 'bg-[#ED5F45] text-white shadow-lg shadow-[#ED5F45]/30'
        : 'bg-[#ED5F45]/10 text-[#ED5F45]/60 border border-[#ED5F45]/20 backdrop-blur-sm'
    );

  return (
    <AuthCampusBackdrop>
      <motion.div
        className="mx-auto w-full max-w-6xl"
        variants={AUTH_CONTAINER_VARIANTS}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="mb-10 text-center sm:mb-12" variants={AUTH_ITEM_VARIANTS}>
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
                className="h-10 w-10 text-[#ED5F45] sm:h-11 sm:w-11"
                aria-hidden
              />
            )}
          </motion.div>
          <h1 className={cn('mb-3 text-4xl sm:text-5xl md:text-6xl', AUTH_WELCOME_HEADLINE_CLASS)}>
            Join Academia
          </h1>
          <p className="mx-auto max-w-lg text-pretty text-base text-white/90 drop-shadow-sm sm:text-lg font-medium">
            Transform your institution with the next generation of academic management.
          </p>
        </motion.div>

        <div className="grid items-stretch gap-8 lg:grid-cols-[1.1fr_1fr]">
          <motion.div className="order-2 space-y-6 lg:order-1" variants={AUTH_SLIDE_LEFT_VARIANTS}>
            <AuthTiltCard>
              <div className="group relative overflow-hidden rounded-[2.5rem] border border-[#ED5F45]/20 bg-slate-950/40 p-8 shadow-2xl backdrop-blur-xl">
                <div className="absolute inset-x-0 top-0 h-1 bg-[#ED5F45] opacity-90" />
                <div className="relative z-[1]">
                  <h3 className="mb-6 flex items-center gap-3 text-lg font-black text-white sm:text-xl uppercase tracking-tight">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ED5F45]/20 border border-[#ED5F45]/30">
                      <CheckCircle2 className="h-5 w-5 text-[#ED5F45]" />
                    </span>
                    Institutional Benefits
                  </h3>
                  <ul className="space-y-4">
                    {[
                      'Streamlined project lifecycle management',
                      'Integrated automated defense scheduling',
                      'Unified institutional progress tracking',
                      'Permission-based multi-role dashboards',
                      'Secure multitenant cloud architecture',
                    ].map((benefit, index) => (
                      <motion.li
                        key={benefit}
                        className="flex items-start gap-4 text-sm text-slate-100 sm:text-base font-medium"
                        initial={{ opacity: 0, x: -14 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.18 + index * 0.07 }}
                      >
                        <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ED5F45]/20 border border-[#ED5F45]/30">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#ED5F45]" />
                        </span>
                        {benefit}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </AuthTiltCard>

            <AuthTiltCard>
               <div className="group relative overflow-hidden rounded-[2.5rem] border border-[#ED5F45]/20 bg-gradient-to-br from-[#ED5F45]/10 via-slate-900/40 to-slate-950/80 p-8 text-white backdrop-blur-xl">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ED5F45] via-[#F47A64] to-[#ED5F45] opacity-80" />
                <div className="relative z-[1]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#ED5F45]/30 ring-4 ring-[#ED5F45]/10">
                    <GraduationCap className="h-6 w-6 text-[#ED5F45]" />
                  </div>
                  <h3 className="mb-2 text-lg font-black sm:text-xl uppercase tracking-tight">Department-Led Success</h3>
                  <p className="text-sm leading-relaxed text-white/80 sm:text-base font-medium">
                    Empower your department heads with tools designed to optimize academic outcomes and institutional efficiency.
                  </p>
                </div>
              </div>
            </AuthTiltCard>
          </motion.div>

          <motion.div
            className="order-1 lg:order-2"
            variants={AUTH_SLIDE_RIGHT_VARIANTS}
          >
            <AuthTiltCard>
              <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white dark:bg-slate-900 shadow-2xl backdrop-blur-2xl">
                <div className="h-1.5 w-full bg-gradient-to-r from-[#ED5F45] via-[#F47A64] to-[#ED5F45]" />
                
                <div className="px-6 pb-10 pt-8 sm:px-10">
                  <div className="mb-8 text-center">
                    <div className="flex flex-wrap items-center justify-center gap-3 mb-5">
                      <span className={stepChipClass(step === 1)}>1 · DEPT</span>
                      <ArrowRight className="h-4 w-4 text-slate-300" aria-hidden />
                      <span className={stepChipClass(step === 2)}>2 · ACCOUNT</span>
                    </div>
                    
                    <h2 className="text-2xl font-black text-slate-900 sm:text-3xl dark:text-slate-100 uppercase tracking-tight">
                      {step === 1 ? 'Register Setup' : 'Admin Details'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium text-pretty leading-snug">
                      {step === 1
                        ? 'Initialize your department at Haramaya University.'
                        : 'Configure the administrator account for this department.'}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <input type="hidden" {...register('universityName')} />

                    <AnimatePresence mode="wait">
                      {step === 1 ? (
                        <motion.div
                          key="step1"
                          className="space-y-5"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <div className="space-y-2">
                            <Label htmlFor="departmentName" className="flex items-center gap-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                              <GraduationCap className={cn('h-3.5 w-3.5 shrink-0', AUTH_ACCENT_ICON)} />
                              Department Name
                            </Label>
                            <select
                              id="departmentName"
                              {...register('departmentName')}
                              className={cn(
                                AUTH_FORM_INPUT_CLASS,
                                'h-12 w-full rounded-xl border-2 px-4 text-sm font-bold'
                              )}
                            >
                              <option value="" disabled>Select Department</option>
                              {DEPARTMENT_NAME_OPTIONS.map((name) => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </select>
                            {errors.departmentName && <p className="text-[11px] font-bold text-destructive px-1">{errors.departmentName.message}</p>}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="departmentCode" className="flex items-center gap-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                              <Building2 className={cn('h-3.5 w-3.5 shrink-0', AUTH_ACCENT_ICON)} />
                              Dept Code
                            </Label>
                            <Input
                              id="departmentCode"
                              {...register('departmentCode')}
                              placeholder="e.g. CS, SWE, IS"
                              className={cn(AUTH_FORM_INPUT_CLASS, "h-12 rounded-xl border-2")}
                            />
                            {errors.departmentCode && <p className="text-[11px] font-bold text-destructive px-1">{errors.departmentCode.message}</p>}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="departmentDescription" className="flex items-center gap-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                              <Info className={cn('h-3.5 w-3.5 shrink-0', AUTH_ACCENT_ICON)} />
                              Brief Info
                            </Label>
                            <Input
                              id="departmentDescription"
                              {...register('departmentDescription')}
                              placeholder="Optional department description"
                              className={cn(AUTH_FORM_INPUT_CLASS, "h-12 rounded-xl border-2")}
                            />
                          </div>

                          <Button
                            type="button"
                            className={cn(AUTH_PRIMARY_BUTTON_CLASS, "h-14 text-base font-black uppercase tracking-widest")}
                            onClick={() => void goToStep2()}
                          >
                            <span className="flex items-center justify-center gap-3">
                              NEXT STEP
                              <ArrowRight className="h-5 w-5" />
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
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="firstName" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">First Name</Label>
                              <Input id="firstName" {...register('firstName')} placeholder="John" className={cn(AUTH_FORM_INPUT_CLASS, "h-12 rounded-xl border-2")} />
                              {errors.firstName && <p className="text-[11px] font-bold text-destructive px-1">{errors.firstName.message}</p>}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="lastName" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Name</Label>
                              <Input id="lastName" {...register('lastName')} placeholder="Doe" className={cn(AUTH_FORM_INPUT_CLASS, "h-12 rounded-xl border-2")} />
                              {errors.lastName && <p className="text-[11px] font-bold text-destructive px-1">{errors.lastName.message}</p>}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              <Mail className={cn('h-3.5 w-3.5 shrink-0', AUTH_ACCENT_ICON)} />
                              Work Email
                            </Label>
                            <Input id="email" type="email" {...register('email')} placeholder="admin@haramaya.edu" className={cn(AUTH_FORM_INPUT_CLASS, "h-12 rounded-xl border-2")} />
                            {errors.email && <p className="text-[11px] font-bold text-destructive px-1">{errors.email.message}</p>}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="password" className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              <Lock className={cn('h-3.5 w-3.5 shrink-0', AUTH_ACCENT_ICON)} />
                              Password
                            </Label>
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
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                              >
                                {isPasswordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                            <p className="flex items-center gap-1.5 px-1 text-[10px] font-black text-[#ED5F45] uppercase tracking-widest">
                              <Info className="h-3 w-3 shrink-0" />
                              Mixed case + digit
                            </p>
                            {errors.password && <p className="text-[11px] font-bold text-destructive px-1">{errors.password.message}</p>}
                          </div>

                          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-14 rounded-xl border-2 border-slate-200 font-black text-slate-500 uppercase tracking-widest sm:flex-1"
                              onClick={() => { clearError(); setStep(1); }}
                            >
                              BACK
                            </Button>
                            <Button
                              type="submit"
                              className={cn(AUTH_PRIMARY_BUTTON_CLASS, "h-14 text-base font-black uppercase tracking-widest sm:flex-[2]")}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <span className="flex items-center gap-3">
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                  LAUNCHING...
                                </span>
                              ) : (
                                <span className="flex items-center justify-center gap-3">
                                  FINISH
                                  <ArrowRight className="h-5 w-5" />
                                </span>
                              )}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {error && (
                      <Alert variant="destructive" className="rounded-xl border-[#ED5F45]/20 bg-[#ED5F45]/5 text-[#ED5F45] py-2 px-3">
                        <AlertDescription className="text-xs font-bold">{error}</AlertDescription>
                      </Alert>
                    )}

                    {successMessage && (
                      <Alert className="rounded-xl border-emerald-500/20 bg-emerald-500/10 text-emerald-600 py-2 px-3">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription className="text-xs font-bold">{successMessage}</AlertDescription>
                      </Alert>
                    )}
                  </form>

                  <p className="mt-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                    Already an admin?{' '}
                    <Link href="/login" className="font-black text-[#ED5F45] hover:underline uppercase text-xs tracking-widest">
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </AuthTiltCard>
          </motion.div>
        </div>
      </motion.div>
    </AuthCampusBackdrop>
  );
}
