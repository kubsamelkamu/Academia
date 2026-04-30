'use client'

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
            Verify reset code
          </h1>
          <p className="mx-auto max-w-lg text-pretty text-base font-medium text-slate-600 sm:text-lg">
            Step 2 of 3 — confirm the 6-digit code we sent to your email.
          </p>
        </motion.div>

        <div className="grid items-stretch gap-8 lg:grid-cols-[1fr_420px]">
          <motion.div className="order-2 space-y-6 lg:order-1" variants={AUTH_SLIDE_LEFT_VARIANTS}>
            <AuthTiltCard>
              <div className="relative overflow-hidden rounded-[2.5rem] border border-[#ED5F45]/20 bg-slate-950/40 p-8 shadow-2xl backdrop-blur-xl">
                <div className="absolute inset-x-0 top-0 h-1 bg-[#ED5F45] opacity-90" />
                <h3 className="mb-6 flex items-center gap-3 text-lg font-black uppercase tracking-tight text-white sm:text-xl">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ED5F45]/30 bg-[#ED5F45]/20">
                    <Mail className="h-5 w-5 text-[#ED5F45]" />
                  </span>
                  What happens next
                </h3>
                <ul className="space-y-4 text-sm font-medium text-slate-100 sm:text-base">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#ED5F45]/30 bg-[#ED5F45]/20 text-xs font-bold text-[#ED5F45]">
                      1
                    </span>
                    Enter the code from your inbox
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#ED5F45]/30 bg-[#ED5F45]/20 text-xs font-bold text-[#ED5F45]">
                      2
                    </span>
                    We verify and unlock the reset step
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#ED5F45]/30 bg-[#ED5F45]/20 text-xs font-bold text-[#ED5F45]">
                      3
                    </span>
                    You choose a new password
                  </li>
                </ul>
              </div>
            </AuthTiltCard>

            <AuthTiltCard>
              <div className="relative overflow-hidden rounded-[2.5rem] border border-[#ED5F45]/20 bg-gradient-to-br from-[#ED5F45]/10 via-slate-900/40 to-slate-950/80 p-8 text-white backdrop-blur-xl">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ED5F45] via-[#F47A64] to-[#ED5F45] opacity-80" />
                <CheckCircle2 className="mb-3 h-8 w-8 text-[#ED5F45]" />
                <h3 className="mb-2 text-lg font-black uppercase tracking-tight">Code sent</h3>
                <p className="break-all text-sm font-medium text-white/85 sm:text-base">
                  We sent the verification code to {email || 'your email'}.
                </p>
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
                      <KeyRound className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                      Enter code
                    </h2>
                    <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                      Sent to <strong>{email || 'your email'}</strong>
                    </p>
                    <div className="mt-6">
                      <ForgotPasswordProgress
                        currentStep="verify"
                        stepLinks={{
                          request: '/forgot-password',
                        }}
                      />
                    </div>
                  </div>

                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-2">
                      <Label
                        htmlFor="otp"
                        className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
                      >
                        <Shield className={cn('h-3.5 w-3.5 shrink-0', AUTH_ACCENT_ICON)} />
                        6-digit code
                      </Label>
                      <Input
                        id="otp"
                        {...form.register('otp')}
                        placeholder="123456"
                        maxLength={6}
                        className={cn(
                          AUTH_FORM_INPUT_CLASS,
                          'h-14 rounded-xl border-2 text-center font-mono text-2xl tracking-[0.35em]',
                        )}
                      />
                      {form.formState.errors.otp ? (
                        <p className="text-center text-[11px] font-bold text-destructive">
                          {form.formState.errors.otp.message}
                        </p>
                      ) : null}
                    </div>

                    <AnimatePresence>
                      {error ? (
                        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                          <Alert variant="destructive" className="rounded-xl border-[#ED5F45]/20 bg-[#ED5F45]/5 text-[#ED5F45]">
                            <AlertDescription className="text-xs font-bold">{error}</AlertDescription>
                          </Alert>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    <Button
                      type="submit"
                      className={cn(AUTH_PRIMARY_BUTTON_CLASS, 'h-14 text-base font-black uppercase tracking-widest')}
                      disabled={verifyLoading}
                    >
                      {verifyLoading ? (
                        <span className="z-[1] flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Verifying…
                        </span>
                      ) : (
                        <span className="z-[1] flex items-center justify-center gap-3">
                          Verify code
                          <ArrowRight className="h-5 w-5" />
                        </span>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 w-full rounded-xl border-2 border-[#ED5F45]/30 font-bold text-[#ED5F45] hover:bg-[#ED5F45]/10"
                      disabled={resendLoading || countdown > 0}
                      onClick={onResend}
                    >
                      {countdown > 0 ? (
                        <span className="flex items-center justify-center gap-2">
                          <Clock className="h-4 w-4" />
                          Resend in {countdown}s
                        </span>
                      ) : resendLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Resend code'
                      )}
                    </Button>

                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <button type="button" className="text-[#ED5F45] hover:underline" onClick={handleUseDifferentEmail}>
                        Different email
                      </button>
                      <Link href="/login" className="text-[#ED5F45] hover:underline">
                        Back to sign in
                      </Link>
                    </div>
                  </form>
                </div>
              </div>
            </AuthTiltCard>
          </motion.div>
        </div>
      </motion.div>
    </AuthCampusBackdrop>
  )
}

export default function ForgotPasswordVerifyPage() {
  return (
    <Suspense
      fallback={
        <AuthCampusBackdrop>
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-slate-500" />
            <p className="text-sm font-medium text-slate-600">Loading…</p>
          </div>
        </AuthCampusBackdrop>
      }
    >
      <ForgotPasswordVerifyPageContent />
    </Suspense>
  )
}
