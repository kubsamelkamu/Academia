'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
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
  CheckCircle2,
  ArrowRight,
  Clock,
  GraduationCap,
  BarChart3,
} from 'lucide-react'
import { RegistrationProgress } from '@/components/auth/registration-progress'
import { useAuthStore } from '@/store/auth-store'
import { verifyOtpSchema, VerifyOtpFormData } from '@/validations/auth'
import { AUTH_FORM_COLUMN_WRAP, AUTH_FORM_INPUT_CLASS, AUTH_MARKETING_COLUMN_WRAP, AUTH_PAGE_WRAP, AUTH_PRIMARY_BUTTON_CLASS, AUTH_SPLIT_CARD_GRID } from '@/components/auth/auth-campus-backdrop'
import { AuthTiltCard, AUTH_CONTAINER_VARIANTS, AUTH_ITEM_VARIANTS } from '@/components/auth/auth-tilt-card'
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

  const onResend = async () => {
    if (!tenantDomain || countdown > 0 || !registration) return
    try {
      setResendLoading(true)
      await resendEmailOtp({ email: registration.departmentHead.email })
      setResendMessage('OTP sent successfully! Check your email.')
      setCountdown(60)
    } catch {
      setResendMessage('Failed to resend OTP. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  if (!registration) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-200 px-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#ED5F45]" aria-hidden />
      </div>
    )
  }

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

              <motion.div variants={AUTH_ITEM_VARIANTS} className="mb-6 space-y-2">
                <h1 className="text-balance text-2xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Verify your email</h1>
                <p className="max-w-md text-sm leading-6 text-slate-600">
                  Enter the 6-digit code we sent to secure your department head account.
                </p>
              </motion.div>

              <motion.div variants={AUTH_ITEM_VARIANTS} className="mb-6">
                <RegistrationProgress currentStep="verify" />
              </motion.div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <motion.div className="space-y-2" variants={AUTH_ITEM_VARIANTS}>
                  <Label htmlFor="otp" className="text-sm font-medium text-slate-700">
                    Verification code
                  </Label>
                  <Input
                    id="otp"
                    {...register('otp')}
                    placeholder="000000"
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className={cn(
                      AUTH_FORM_INPUT_CLASS,
                      'h-12 w-full min-w-0 rounded-xl border-slate-300 text-center font-mono text-base tracking-[0.22em] sm:tracking-[0.35em]',
                    )}
                  />
                  <AnimatePresence>
                    {errors.otp ? (
                      <motion.p
                        className="text-xs font-medium text-destructive"
                        initial={{ opacity: 0, y: -4 }}
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
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <Alert variant="destructive" className="rounded-xl py-2.5">
                        <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <motion.div variants={AUTH_ITEM_VARIANTS}>
                  <Button
                    type="submit"
                    className={cn(AUTH_PRIMARY_BUTTON_CLASS, 'h-12 w-full rounded-xl text-sm font-semibold')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying…
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Verify email
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </motion.div>
              </form>

              <div className="mt-8 border-t border-slate-200 pt-8">
                <p className="mb-4 text-center text-sm text-slate-600">Didn&apos;t receive the code?</p>
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full rounded-xl border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    disabled={resendLoading || countdown > 0}
                    onClick={() => void onResend()}
                  >
                    {resendLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : countdown > 0 ? (
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
                </div>
                {resendMessage ? (
                  <Alert className="mt-4 rounded-xl border-emerald-200 bg-emerald-50 text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription className="text-xs font-medium">{resendMessage}</AlertDescription>
                  </Alert>
                ) : null}
              </div>

              <motion.p variants={AUTH_ITEM_VARIANTS} className="mt-8 flex flex-col gap-2 text-center text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-2">
                <span>
                  Wrong email?{' '}
                  <Link href="/register" className="font-semibold text-[#ED5F45] hover:underline">
                    Start over
                  </Link>
                </span>
                <span className="hidden text-slate-400 sm:inline">·</span>
                <span>
                  <Link href="/login" className="font-semibold text-[#ED5F45] hover:underline">
                    Sign in
                  </Link>
                </span>
              </motion.p>
            </div>

            <div className={AUTH_MARKETING_COLUMN_WRAP}>
              <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
              <div className="pointer-events-none absolute -left-20 bottom-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

              <motion.div variants={AUTH_ITEM_VARIANTS} className="relative z-10 mt-6 space-y-5 md:mt-10 md:space-y-6">
                <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <Mail className="h-5 w-5 text-white/90" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Next steps</h2>
                  </div>
                  <ul className="space-y-3">
                    {verifySteps.map((text) => (
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
                    <h3 className="text-xl font-semibold text-white">Secure verification</h3>
                  </div>
                  <p className="text-sm leading-6 text-white/90">
                    Codes expire quickly and can only be used once—keeping your institution workspace safe.
                  </p>
                </div>
              </motion.div>

              <motion.div variants={AUTH_ITEM_VARIANTS} className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">Sent to</p>
                  <div className="h-px flex-1 bg-white/30" />
                </div>
                <p className="break-all text-sm font-medium text-white/95">{registration.departmentHead.email}</p>
                <div className="flex items-center gap-2 text-xs text-white/75">
                  <GraduationCap className="h-4 w-4 shrink-0" />
                  <span>Department head onboarding</span>
                </div>
              </motion.div>
            </div>
          </div>
        </AuthTiltCard>
      </motion.div>
    </div>
  )
}
