'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  Shield,
  KeyRound,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ForgotPasswordProgress } from '@/components/auth/forgot-password-progress'
import { type ForgotPasswordVerifyFormData, forgotPasswordVerifySchema } from '@/validations/auth'
import { getErrorMessage } from '@/lib/api/errors'
import { resendForgotPasswordOtp, verifyForgotPasswordOtp } from '@/lib/api/auth'
import { clearForgotPasswordFlow, readForgotPasswordFlow, writeForgotPasswordFlow } from '@/lib/auth/forgot-password-flow'
import { useAuthStore } from '@/store/auth-store'
import { AUTH_FORM_COLUMN_WRAP, AUTH_FORM_INPUT_CLASS, AUTH_MARKETING_COLUMN_WRAP, AUTH_PAGE_WRAP, AUTH_PRIMARY_BUTTON_CLASS, AUTH_SPLIT_CARD_GRID } from '@/components/auth/auth-campus-backdrop'
import { AuthTiltCard, AUTH_CONTAINER_VARIANTS, AUTH_ITEM_VARIANTS } from '@/components/auth/auth-tilt-card'
import { cn } from '@/lib/utils'

function ForgotPasswordVerifyPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useAuthStore((s) => s.user)

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const form = useForm<ForgotPasswordVerifyFormData>({
    resolver: zodResolver(forgotPasswordVerifySchema),
    defaultValues: { otp: '' },
  })

  const emailFromQuery = useMemo(() => {
    const raw = (searchParams.get('email') ?? '').trim()
    return raw ? raw.toLowerCase() : ''
  }, [searchParams])

  useEffect(() => {
    if (!user) return
    router.replace('/dashboard')
  }, [router, user])

  useEffect(() => {
    const stored = readForgotPasswordFlow()
    const resolvedEmail = stored?.email ?? emailFromQuery
    if (!resolvedEmail) {
      router.replace('/forgot-password')
      return
    }

    setEmail(resolvedEmail)
    writeForgotPasswordFlow({ email: resolvedEmail })

    const seconds = stored?.resendAvailableAt
      ? Math.max(0, Math.ceil((stored.resendAvailableAt - Date.now()) / 1000))
      : 0
    setCountdown(seconds)
  }, [emailFromQuery, router])

  useEffect(() => {
    if (countdown <= 0) return
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current)
      countdownTimerRef.current = null
    }

    countdownTimerRef.current = setTimeout(() => {
      setCountdown((value) => Math.max(0, value - 1))
      countdownTimerRef.current = null
    }, 1000)

    return () => {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current)
        countdownTimerRef.current = null
      }
    }
  }, [countdown])

  async function onSubmit(values: ForgotPasswordVerifyFormData) {
    if (!email) return

    setError(null)
    setVerifyLoading(true)
    try {
      const result = await verifyForgotPasswordOtp({ email, otp: values.otp })
      writeForgotPasswordFlow({ email, resetToken: result.resetToken })
      toast.success('Code verified', {
        icon: <CheckCircle2 className="w-4 h-4" />,
      })
      router.push('/forgot-password/reset')
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Invalid verification code'))
    } finally {
      setVerifyLoading(false)
    }
  }

  async function onResend() {
    if (!email || countdown > 0) return

    setError(null)
    setResendLoading(true)
    try {
      await resendForgotPasswordOtp({ email })
      const resendAvailableAt = Date.now() + 60_000
      writeForgotPasswordFlow({ email, resendAvailableAt })
      setCountdown(60)
      toast.success('Verification code sent', {
        icon: <Shield className="w-4 h-4" />,
        description: 'Check your email for the new 6-digit code.',
      })
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to resend OTP'))
    } finally {
      setResendLoading(false)
    }
  }

  function handleUseDifferentEmail() {
    clearForgotPasswordFlow()
    router.push('/forgot-password')
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
                <h1 className="text-balance text-2xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Verify reset code</h1>
                <p className="max-w-md text-sm leading-6 text-slate-600">
                  Step 2 of 3 — enter the 6-digit code we sent to your email.
                </p>
              </motion.div>

              <motion.div variants={AUTH_ITEM_VARIANTS} className="mb-6">
                <ForgotPasswordProgress
                  currentStep="verify"
                  stepLinks={{
                    request: '/forgot-password',
                  }}
                />
              </motion.div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <motion.div className="space-y-2" variants={AUTH_ITEM_VARIANTS}>
                  <Label htmlFor="otp" className="text-sm font-medium text-slate-700">
                    6-digit code
                  </Label>
                  <Input
                    id="otp"
                    {...form.register('otp')}
                    placeholder="000000"
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                        className={cn(
                          AUTH_FORM_INPUT_CLASS,
                          'h-12 w-full min-w-0 rounded-xl border-slate-300 text-center font-mono text-base tracking-[0.22em] sm:tracking-[0.35em]',
                        )}
                  />
                  {form.formState.errors.otp ? (
                    <p className="text-xs font-medium text-destructive">{form.formState.errors.otp.message}</p>
                  ) : null}
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
                    disabled={verifyLoading}
                  >
                    {verifyLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying…
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Verify code
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </motion.div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full rounded-xl border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  disabled={resendLoading || countdown > 0}
                  onClick={() => void onResend()}
                >
                  {countdown > 0 ? (
                    <span className="flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4" />
                      Resend in {countdown}s
                    </span>
                  ) : resendLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Mail className="h-4 w-4" />
                      Resend code
                    </span>
                  )}
                </Button>

                <div className="flex flex-col gap-3 pt-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    className="font-medium text-[#ED5F45] hover:underline"
                    onClick={handleUseDifferentEmail}
                  >
                    Use a different email
                  </button>
                  <Link href="/login" className="font-medium text-[#ED5F45] hover:underline">
                    Back to sign in
                  </Link>
                </div>
              </form>
            </div>

            <div className={AUTH_MARKETING_COLUMN_WRAP}>
              <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
              <div className="pointer-events-none absolute -left-20 bottom-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

              <motion.div variants={AUTH_ITEM_VARIANTS} className="relative z-10 mt-6 space-y-5 md:mt-10 md:space-y-6">
                <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <KeyRound className="h-5 w-5 text-white/90" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Recovery steps</h2>
                  </div>
                  <ul className="space-y-3 text-sm leading-6 text-white/90">
                    <li className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/80" aria-hidden />
                      <span>Enter the code from your inbox</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/80" aria-hidden />
                      <span>We verify and unlock the reset step</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/80" aria-hidden />
                      <span>Choose a strong new password</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <BarChart3 className="h-5 w-5 text-white/90" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Why we verify</h3>
                  </div>
                  <p className="text-sm leading-6 text-white/90">
                    A one-time code confirms it&apos;s really you before your password can be changed.
                  </p>
                </div>
              </motion.div>

              <motion.div variants={AUTH_ITEM_VARIANTS} className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">Code sent to</p>
                  <div className="h-px flex-1 bg-white/30" />
                </div>
                <p className="break-all text-sm font-medium text-white/95">{email || 'your email'}</p>
              </motion.div>
            </div>
          </div>
        </AuthTiltCard>
      </motion.div>
    </div>
  )
}

export default function ForgotPasswordVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-200">
          <Loader2 className="h-10 w-10 animate-spin text-[#ED5F45]" aria-hidden />
        </div>
      }
    >
      <ForgotPasswordVerifyPageContent />
    </Suspense>
  )
}
