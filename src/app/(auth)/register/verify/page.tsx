'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Loader2,
  Mail,
  Shield,
  CheckCircle2,
  ArrowRight,
  Clock,
  GraduationCap,
  BarChart3,
} from 'lucide-react'
import { RegistrationProgress } from '@/components/auth/registration-progress'
import { useAuthStore } from '@/store/auth-store'
import { verifyOtpSchema, VerifyOtpFormData, resendOtpSchema, ResendOtpFormData } from '@/validations/auth'
import {
  AuthCampusBackdrop,
  AUTH_ACCENT_ICON,
  AUTH_FORM_INPUT_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  AUTH_WELCOME_HEADLINE_CLASS,
} from '@/components/auth/auth-campus-backdrop'
import {
  AuthTiltCard,
  AUTH_CONTAINER_VARIANTS,
  AUTH_ITEM_VARIANTS,
  AUTH_SLIDE_LEFT_VARIANTS,
  AUTH_SLIDE_RIGHT_VARIANTS,
} from '@/components/auth/auth-tilt-card'
import { cn } from '@/lib/utils'

const verifySteps = [
  'Check your email for the 6-digit verification code',
  'Enter the code below to activate your account',
  'Your institution will be ready for setup',
  'Access your department head dashboard',
]

export default function VerifyPage() {
  const router = useRouter()
  const {
    verifyEmailOtp,
    resendEmailOtp,
    isLoading,
    error,
    clearError,
    clearAuthSession,
    registration,
    tenantDomain,
  } = useAuthStore()

  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string>('')
  const [countdown, setCountdown] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
  })

  const {
    register: registerResend,
    handleSubmit: handleResendSubmit,
  } = useForm<ResendOtpFormData>({
    resolver: zodResolver(resendOtpSchema),
  })

  useEffect(() => {
    if (!registration || !tenantDomain) {
      router.push('/register')
    }
  }, [registration, tenantDomain, router])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const onSubmit = async (data: VerifyOtpFormData) => {
    if (!tenantDomain) return
    try {
      clearError()
      await verifyEmailOtp({
        email: registration!.departmentHead.email,
        otp: data.otp,
      })
      clearAuthSession()
      router.push('/login')
    } catch {
      /* store */
    }
  }

  const onResend = async (data: ResendOtpFormData) => {
    if (!tenantDomain || countdown > 0) return
    try {
      setResendLoading(true)
      await resendEmailOtp({ email: data.email })
      setResendMessage('OTP sent successfully! Check your email.')
      setCountdown(60)
    } catch {
      setResendMessage('Failed to resend OTP. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  if (!registration) {
    return null
  }

  return (
    <AuthCampusBackdrop>
      <motion.div
        className="mx-auto w-full max-w-5xl"
        variants={AUTH_CONTAINER_VARIANTS}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="mb-10 text-center sm:mb-12" variants={AUTH_ITEM_VARIANTS}>
          <motion.div
            className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ED5F45] to-[#F47A64] shadow-lg shadow-[#ED5F45]/30 sm:h-24 sm:w-24"
            whileHover={{ scale: 1.06, rotate: -4 }}
            whileTap={{ scale: 0.94 }}
          >
            <Shield className="h-10 w-10 text-white sm:h-11 sm:w-11" />
          </motion.div>
          <h1 className={cn('mb-3 text-4xl sm:text-5xl md:text-6xl', AUTH_WELCOME_HEADLINE_CLASS)}>
            Verify your email
          </h1>
          <p className="mx-auto max-w-lg text-pretty text-base font-medium text-slate-600 sm:text-lg">
            We&apos;ve sent a verification code to secure your academic institution account.
          </p>
        </motion.div>

        <div className="grid items-stretch gap-8 lg:grid-cols-[1fr_420px]">
          <motion.div className="order-2 space-y-6 lg:order-1" variants={AUTH_SLIDE_LEFT_VARIANTS}>
            <AuthTiltCard>
              <div className="group relative overflow-hidden rounded-[2.5rem] border border-[#ED5F45]/20 bg-slate-950/40 p-8 shadow-2xl backdrop-blur-xl">
                <div className="absolute inset-x-0 top-0 h-1 bg-[#ED5F45] opacity-90" />
                <h3 className="mb-6 flex items-center gap-3 text-lg font-black uppercase tracking-tight text-white sm:text-xl">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ED5F45]/30 bg-[#ED5F45]/20">
                    <Mail className="h-5 w-5 text-[#ED5F45]" />
                  </span>
                  What happens next
                </h3>
                <ul className="space-y-4">
                  {verifySteps.map((step, i) => (
                    <motion.li
                      key={step}
                      className="flex items-start gap-4 text-sm font-medium text-slate-100 sm:text-base"
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.18 + i * 0.07 }}
                    >
                      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#ED5F45]/30 bg-[#ED5F45]/20 text-xs font-bold text-[#ED5F45]">
                        {i + 1}
                      </span>
                      {step}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </AuthTiltCard>

            <AuthTiltCard>
              <div className="group relative overflow-hidden rounded-[2.5rem] border border-[#ED5F45]/20 bg-gradient-to-br from-[#ED5F45]/10 via-slate-900/40 to-slate-950/80 p-8 text-white backdrop-blur-xl">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ED5F45] via-[#F47A64] to-[#ED5F45] opacity-80" />
                <div className="relative z-[1]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#ED5F45]/30 ring-4 ring-[#ED5F45]/10">
                    <GraduationCap className="h-6 w-6 text-[#ED5F45]" />
                  </div>
                  <h3 className="mb-2 text-lg font-black uppercase tracking-tight sm:text-xl">Secure & protected</h3>
                  <p className="text-sm font-medium leading-relaxed text-white/80 sm:text-base">
                    Your verification code ensures only authorized personnel can access your institution&apos;s academic
                    management system.
                  </p>
                </div>
              </div>
            </AuthTiltCard>
          </motion.div>

          <motion.div className="order-1 lg:order-2" variants={AUTH_SLIDE_RIGHT_VARIANTS}>
            <AuthTiltCard>
              <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white shadow-2xl backdrop-blur-2xl dark:bg-slate-900">
                <div className="h-1.5 w-full bg-gradient-to-r from-[#ED5F45] via-[#F47A64] to-[#ED5F45]" />
                <div className="px-6 pb-10 pt-8 sm:px-10">
                  <div className="mb-8 text-center">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ED5F45] to-[#F47A64] shadow-lg shadow-[#ED5F45]/30">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                      Enter verification code
                    </h2>
                    <p className="mt-2 text-sm font-medium leading-snug text-pretty text-slate-500 dark:text-slate-400">
                      We sent a code to <strong>{registration.departmentHead.email}</strong>
                    </p>
                    <div className="mt-6">
                      <RegistrationProgress currentStep="verify" />
                    </div>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <motion.div className="space-y-2" variants={AUTH_ITEM_VARIANTS}>
                      <Label
                        htmlFor="otp"
                        className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
                      >
                        <Shield className={cn('h-3.5 w-3.5 shrink-0', AUTH_ACCENT_ICON)} />
                        6-digit code
                      </Label>
                      <Input
                        id="otp"
                        {...register('otp')}
                        placeholder="123456"
                        maxLength={6}
                        className={cn(
                          AUTH_FORM_INPUT_CLASS,
                          'h-14 rounded-xl border-2 text-center font-mono text-2xl tracking-[0.35em]',
                        )}
                      />
                      <AnimatePresence>
                        {errors.otp ? (
                          <motion.p
                            className="text-center text-[11px] font-bold text-destructive"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                          >
                            {errors.otp.message}
                          </motion.p>
                        ) : null}
                      </AnimatePresence>
                    </motion.div>

                    <AnimatePresence>
                      {error ? (
                        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                          <Alert variant="destructive" className="rounded-xl border-[#ED5F45]/20 bg-[#ED5F45]/5 text-[#ED5F45]">
                            <AlertDescription className="text-xs font-bold">{error}</AlertDescription>
                          </Alert>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    <Button
                      type="submit"
                      className={cn(AUTH_PRIMARY_BUTTON_CLASS, 'h-14 text-base font-black uppercase tracking-widest')}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="z-[1] h-5 w-5 animate-spin" />
                          Verifying…
                        </span>
                      ) : (
                        <span className="z-[1] flex items-center justify-center gap-3">
                          Verify email
                          <ArrowRight className="h-5 w-5" />
                        </span>
                      )}
                    </Button>
                  </form>

                  <div className="mt-8 border-t border-slate-200 pt-8 dark:border-slate-700">
                    <p className="mb-4 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                      Didn&apos;t receive the code?
                    </p>
                    <form onSubmit={handleResendSubmit(onResend)} className="space-y-3">
                      <Input
                        {...registerResend('email')}
                        defaultValue={registration.departmentHead.email}
                        placeholder="Email"
                        disabled={countdown > 0}
                        className={cn(AUTH_FORM_INPUT_CLASS, 'h-12 rounded-xl border-2')}
                      />
                      <Button
                        type="submit"
                        variant="outline"
                        className="h-12 w-full rounded-xl border-2 border-[#ED5F45]/30 font-bold text-[#ED5F45] hover:bg-[#ED5F45]/10"
                        disabled={resendLoading || countdown > 0}
                      >
                        {resendLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {countdown > 0 ? (
                          <span className="flex items-center justify-center gap-2">
                            <Clock className="h-4 w-4" />
                            Resend in {countdown}s
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <Mail className="h-4 w-4" />
                            Resend code
                          </span>
                        )}
                      </Button>
                    </form>
                    {resendMessage ? (
                      <Alert className="mt-4 rounded-xl">
                        <CheckCircle2 className="h-4 w-4 text-[#ED5F45]" />
                        <AlertDescription>{resendMessage}</AlertDescription>
                      </Alert>
                    ) : null}
                  </div>
                </div>
              </div>
            </AuthTiltCard>
          </motion.div>
        </div>
      </motion.div>
    </AuthCampusBackdrop>
  )
}
