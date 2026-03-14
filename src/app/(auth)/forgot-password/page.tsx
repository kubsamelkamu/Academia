'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowRight, KeyRound, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ForgotPasswordProgress } from '@/components/auth/forgot-password-progress'
import {
  forgotPasswordRequestSchema,
  type ForgotPasswordRequestFormData,
} from '@/validations/auth'
import { getErrorMessage } from '@/lib/api/errors'
import { requestForgotPassword } from '@/lib/api/auth'
import { clearForgotPasswordFlow, writeForgotPasswordFlow } from '@/lib/auth/forgot-password-flow'
import { useAuthStore } from '@/store/auth-store'

const containerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

export default function ForgotPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useAuthStore((s) => s.user)

  const [error, setError] = useState<string | null>(null)
  const [requestLoading, setRequestLoading] = useState(false)

  const emailFromQuery = useMemo(() => {
    const raw = (searchParams.get('email') ?? '').trim()
    if (!raw) return ''
    return raw.toLowerCase()
  }, [searchParams])

  useEffect(() => {
    if (!user) return
    router.replace('/dashboard')
  }, [router, user])

  const requestForm = useForm<ForgotPasswordRequestFormData>({
    resolver: zodResolver(forgotPasswordRequestSchema),
    defaultValues: { email: emailFromQuery },
  })

  useEffect(() => {
    if (!emailFromQuery) return
    requestForm.setValue('email', emailFromQuery, { shouldDirty: false, shouldTouch: false })
  }, [emailFromQuery, requestForm])

  async function onRequest(values: ForgotPasswordRequestFormData) {
    setError(null)
    setRequestLoading(true)
    try {
      const normalizedEmail = values.email.trim().toLowerCase()
      await requestForgotPassword({ email: normalizedEmail })
      clearForgotPasswordFlow()
      writeForgotPasswordFlow({
        email: normalizedEmail,
        resendAvailableAt: Date.now() + 60_000,
      })

      toast.success('Check your email', {
        icon: <Mail className="w-4 h-4" />,
        description: 'If an account exists for that email, a verification code has been sent.',
      })

      router.push(`/forgot-password/verify?email=${encodeURIComponent(normalizedEmail)}`)
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to request password reset'))
    } finally {
      setRequestLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div className="w-full max-w-xl" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div className="text-center mb-6" variants={itemVariants}>
          <motion.div
            className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl mb-4"
            whileHover={{ scale: 1.05, rotate: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <KeyRound className="w-7 h-7 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-1">Forgot your password?</h1>
          <p className="text-muted-foreground">Step 1 of 3 — request a verification code securely.</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl">Request a code</CardTitle>
              <CardDescription>Enter your email and we&apos;ll send you a 6-digit verification code.</CardDescription>
              <ForgotPasswordProgress currentStep="request" />
            </CardHeader>

            <CardContent className="space-y-6">
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <form className="space-y-5" onSubmit={requestForm.handleSubmit(onRequest)}>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@university.edu"
                    {...requestForm.register('email')}
                  />
                  {requestForm.formState.errors.email ? (
                    <p className="text-sm text-destructive">{requestForm.formState.errors.email.message}</p>
                  ) : null}
                </div>

                <Button type="submit" className="w-full" disabled={requestLoading}>
                  {requestLoading ? 'Sending…' : (
                    <span className="flex items-center justify-center gap-2">
                      Send verification code
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Remembered your password?{' '}
                  <Link href="/login" className="text-foreground hover:underline">
                    Sign in
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
