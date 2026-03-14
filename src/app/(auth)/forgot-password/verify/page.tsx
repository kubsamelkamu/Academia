'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowRight, CheckCircle2, Clock, Mail, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ForgotPasswordProgress } from '@/components/auth/forgot-password-progress'
import { type ForgotPasswordVerifyFormData, forgotPasswordVerifySchema } from '@/validations/auth'
import { getErrorMessage } from '@/lib/api/errors'
import { resendForgotPasswordOtp, verifyForgotPasswordOtp } from '@/lib/api/auth'
import { clearForgotPasswordFlow, readForgotPasswordFlow, writeForgotPasswordFlow } from '@/lib/auth/forgot-password-flow'
import { useAuthStore } from '@/store/auth-store'

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
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function ForgotPasswordVerifyPage() {
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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div className="w-full max-w-4xl" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div className="text-center mb-8" variants={itemVariants}>
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl mb-4"
            whileHover={{ scale: 1.05, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Shield className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Verify Reset Code
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Step 2 of 3: confirm the 6-digit code we sent to your email
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <motion.div className="space-y-6" variants={itemVariants}>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-500" />
                What happens next?
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center gap-3"><span className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full text-xs font-semibold text-blue-600">1</span>Enter the code from your email inbox</li>
                <li className="flex items-center gap-3"><span className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full text-xs font-semibold text-blue-600">2</span>We verify the code and open the reset step</li>
                <li className="flex items-center gap-3"><span className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full text-xs font-semibold text-blue-600">3</span>You set a brand new password</li>
              </ul>
            </div>

            <motion.div
              className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-6 text-white"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <CheckCircle2 className="w-8 h-8 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Code Sent</h3>
              <p className="text-green-100 break-all">
                We sent the verification code to {email || 'your email address'}.
              </p>
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-xl">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                  <Shield className="w-6 h-6 text-green-500" />
                  Enter Verification Code
                </CardTitle>
                <CardDescription className="text-center">
                  We sent a code to <strong>{email || 'your email'}</strong>
                </CardDescription>
                <ForgotPasswordProgress
                  currentStep="verify"
                  stepLinks={{
                    request: '/forgot-password',
                  }}
                />
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="flex items-center gap-2 text-center justify-center">
                      <Shield className="w-4 h-4" />
                      6-Digit Verification Code
                    </Label>
                    <Input
                      id="otp"
                      {...form.register('otp')}
                      placeholder="123456"
                      maxLength={6}
                      className="text-center text-2xl font-mono tracking-widest transition-all duration-200 focus:ring-2 focus:ring-green-500/20"
                    />
                    {form.formState.errors.otp ? (
                      <p className="text-sm text-red-600 text-center">{form.formState.errors.otp.message}</p>
                    ) : null}
                  </div>

                  {error ? (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : null}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    disabled={verifyLoading}
                  >
                    {verifyLoading ? 'Verifying...' : (
                      <span className="flex items-center justify-center gap-2">
                        Verify code
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    disabled={resendLoading || countdown > 0}
                    onClick={onResend}
                  >
                    {countdown > 0 ? (
                      <span className="flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4" />
                        Resend in {countdown}s
                      </span>
                    ) : 'Resend code'}
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <button type="button" className="text-muted-foreground hover:text-foreground" onClick={handleUseDifferentEmail}>
                      Use a different email
                    </button>
                    <Link href="/login" className="text-muted-foreground hover:text-foreground">
                      Back to sign in
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
