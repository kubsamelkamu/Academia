'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Key, Lock, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ForgotPasswordProgress } from '@/components/auth/forgot-password-progress'
import { cn } from '@/lib/utils'
import { type ForgotPasswordResetFormData, forgotPasswordResetSchema } from '@/validations/auth'
import { getErrorMessage } from '@/lib/api/errors'
import { resetForgotPassword } from '@/lib/api/auth'
import { clearForgotPasswordFlow, readForgotPasswordFlow } from '@/lib/auth/forgot-password-flow'
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

export default function ForgotPasswordResetPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<ForgotPasswordResetFormData>({
    resolver: zodResolver(forgotPasswordResetSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (!user) return
    router.replace('/dashboard')
  }, [router, user])

  useEffect(() => {
    const flow = readForgotPasswordFlow()
    if (!flow?.email) {
      router.replace('/forgot-password')
      return
    }
    if (!flow.resetToken) {
      router.replace('/forgot-password/verify')
      return
    }

    setEmail(flow.email)
    setResetToken(flow.resetToken)
  }, [router])

  async function onSubmit(values: ForgotPasswordResetFormData) {
    if (!resetToken) return

    setError(null)
    setIsSubmitting(true)
    try {
      await resetForgotPassword({ resetToken, newPassword: values.newPassword })
      clearForgotPasswordFlow()
      toast.success('Password reset successfully', {
        icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
      })
      router.replace('/login')
    } catch (e: unknown) {
      const message = getErrorMessage(e, 'Failed to reset password')
      setError(message)
      if (/expired|invalid/i.test(message)) {
        router.replace('/forgot-password/verify')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const newPassword = useWatch({ control: form.control, name: 'newPassword' }) ?? ''
  const confirmPassword = useWatch({ control: form.control, name: 'confirmPassword' }) ?? ''

  const passwordStrength = useMemo(() => {
    let strength = 0
    if (newPassword.length >= 8) strength++
    if (/[A-Z]/.test(newPassword)) strength++
    if (/[a-z]/.test(newPassword)) strength++
    if (/[0-9]/.test(newPassword)) strength++
    if (/[^A-Za-z0-9]/.test(newPassword)) strength++
    return Math.min(strength, 3)
  }, [newPassword])

  const checks = useMemo(
    () => ({
      minLength: newPassword.length >= 8,
      hasUppercase: /[A-Z]/.test(newPassword),
      hasLowercase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
      matches:
        confirmPassword.length > 0 && newPassword.length > 0 && newPassword === confirmPassword,
    }),
    [confirmPassword, newPassword]
  )

  const strengthLabel = useMemo(() => {
    if (!newPassword) return 'Enter a password'
    if (passwordStrength === 0) return 'Very Weak'
    if (passwordStrength === 1) return 'Weak'
    if (passwordStrength === 2) return 'Medium'
    return 'Strong'
  }, [passwordStrength, newPassword])

  const strengthColor = useMemo(() => {
    if (!newPassword) return 'bg-gray-200'
    if (passwordStrength === 0) return 'bg-red-500'
    if (passwordStrength === 1) return 'bg-orange-500'
    if (passwordStrength === 2) return 'bg-yellow-500'
    return 'bg-green-500'
  }, [passwordStrength, newPassword])

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
            Set a New Password
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Step 3 of 3: choose a strong password for {email || 'your account'}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <motion.div className="space-y-6" variants={itemVariants}>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-500" />
                Password guidance
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center gap-3">Use at least 8 characters</li>
                <li className="flex items-center gap-3">Mix upper/lowercase letters and numbers</li>
                <li className="flex items-center gap-3">Add a symbol for stronger protection</li>
              </ul>
            </div>

            <div className="rounded-xl border p-4 bg-background/80">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Strength</span>
                <span className="font-medium">{strengthLabel}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[0, 1, 2].map((segment) => (
                  <div
                    key={segment}
                    className={cn(
                      'h-2 rounded-full bg-gray-200 transition-colors',
                      passwordStrength > segment ? strengthColor : 'bg-gray-200'
                    )}
                  />
                ))}
              </div>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className={checks.minLength ? 'text-green-600' : undefined}>At least 8 characters</div>
                <div className={checks.hasUppercase ? 'text-green-600' : undefined}>Contains an uppercase letter</div>
                <div className={checks.hasLowercase ? 'text-green-600' : undefined}>Contains a lowercase letter</div>
                <div className={checks.hasNumber ? 'text-green-600' : undefined}>Contains a number</div>
                <div className={checks.hasSpecial ? 'text-green-600' : undefined}>Contains a special character</div>
                <div className={checks.matches ? 'text-green-600' : undefined}>Passwords match</div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-xl">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                  <Lock className="w-6 h-6 text-green-500" />
                  Reset Password
                </CardTitle>
                <CardDescription className="text-center">
                  Create a new password for <strong>{email || 'your account'}</strong>
                </CardDescription>
                <ForgotPasswordProgress
                  currentStep="reset"
                  stepLinks={{
                    request: '/forgot-password',
                    verify: '/forgot-password/verify',
                  }}
                />
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                  {error ? (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        {...form.register('newPassword')}
                        placeholder="Enter a strong password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword((value) => !value)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {form.formState.errors.newPassword ? (
                      <p className="text-sm text-destructive">{form.formState.errors.newPassword.message}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...form.register('confirmPassword')}
                        placeholder="Re-enter your new password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={() => setShowConfirmPassword((value) => !value)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {form.formState.errors.confirmPassword ? (
                      <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
                    ) : null}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Resetting password...' : 'Reset password'}
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <Link href="/forgot-password/verify" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <ArrowLeft className="w-4 h-4" />
                      Back to verify
                    </Link>
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
