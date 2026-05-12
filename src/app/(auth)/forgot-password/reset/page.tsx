'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Key, Lock, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { AUTH_FORM_COLUMN_WRAP, AUTH_FORM_INPUT_CLASS, AUTH_MARKETING_COLUMN_WRAP, AUTH_PAGE_WRAP, AUTH_PRIMARY_BUTTON_CLASS, AUTH_SPLIT_CARD_GRID } from '@/components/auth/auth-campus-backdrop'
import { AuthTiltCard, AUTH_CONTAINER_VARIANTS, AUTH_ITEM_VARIANTS } from '@/components/auth/auth-tilt-card'

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
        icon: <CheckCircle2 className="h-4 w-4 text-[#ED5F45]" />,
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
    if (passwordStrength === 0) return 'Very weak'
    if (passwordStrength === 1) return 'Weak'
    if (passwordStrength === 2) return 'Medium'
    return 'Strong'
  }, [passwordStrength, newPassword])

  const strengthColor = useMemo(() => {
    if (!newPassword) return 'bg-white/25'
    if (passwordStrength === 0) return 'bg-red-400'
    if (passwordStrength === 1) return 'bg-orange-400'
    if (passwordStrength === 2) return 'bg-yellow-300'
    return 'bg-emerald-400'
  }, [passwordStrength, newPassword])

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
                <h1 className="text-balance text-2xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Set a new password</h1>
                <p className="max-w-md text-sm leading-6 text-slate-600">
                  Step 3 of 3 — choose a strong password for <span className="font-medium text-slate-800">{email || 'your account'}</span>.
                </p>
              </motion.div>

              <motion.div variants={AUTH_ITEM_VARIANTS} className="mb-6">
                <ForgotPasswordProgress
                  currentStep="reset"
                  stepLinks={{
                    request: '/forgot-password',
                    verify: '/forgot-password/verify',
                  }}
                />
              </motion.div>

              <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                <AnimatePresence>
                  {error ? (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <Alert variant="destructive" className="rounded-xl py-2.5">
                        <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <motion.div className="space-y-2" variants={AUTH_ITEM_VARIANTS}>
                  <Label htmlFor="newPassword" className="text-sm font-medium text-slate-700">
                    New password
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative min-w-0 flex-1">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="newPassword"
                        {...form.register('newPassword')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Strong password"
                        autoComplete="new-password"
                        className={cn(
                          AUTH_FORM_INPUT_CLASS,
                          'h-12 rounded-xl border-slate-300 pl-10 pr-3 text-sm',
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {form.formState.errors.newPassword ? (
                    <p className="text-xs font-medium text-destructive">{form.formState.errors.newPassword.message}</p>
                  ) : null}
                </motion.div>

                <motion.div className="space-y-2" variants={AUTH_ITEM_VARIANTS}>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                    Confirm password
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative min-w-0 flex-1">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="confirmPassword"
                        {...form.register('confirmPassword')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Repeat password"
                        autoComplete="new-password"
                        className={cn(
                          AUTH_FORM_INPUT_CLASS,
                          'h-12 rounded-xl border-slate-300 pl-10 pr-3 text-sm',
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {form.formState.errors.confirmPassword ? (
                    <p className="text-xs font-medium text-destructive">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  ) : null}
                </motion.div>

                <motion.div variants={AUTH_ITEM_VARIANTS}>
                  <Button
                    type="submit"
                    className={cn(AUTH_PRIMARY_BUTTON_CLASS, 'h-12 w-full rounded-xl text-sm font-semibold')}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">Resetting…</span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Reset password
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </motion.div>

                <div className="flex flex-col gap-3 pt-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    href="/forgot-password/verify"
                    className="inline-flex items-center gap-2 font-medium text-[#ED5F45] hover:underline"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to verify
                  </Link>
                  <Link href="/login" className="font-medium text-[#ED5F45] hover:underline">
                    Sign in
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
                      <Key className="h-5 w-5 text-white/90" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Password guidance</h2>
                  </div>
                  <ul className="space-y-3 text-sm leading-6 text-white/90">
                    <li className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/80" aria-hidden />
                      <span>At least 8 characters</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/80" aria-hidden />
                      <span>Upper and lowercase letters</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/80" aria-hidden />
                      <span>Numbers and a special character</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                        <BarChart3 className="h-5 w-5 text-white/90" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Strength</p>
                        <p className="text-lg font-semibold text-white">{strengthLabel}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((segment) => (
                      <div
                        key={segment}
                        className={cn(
                          'h-2 rounded-full transition-colors',
                          passwordStrength > segment ? strengthColor : 'bg-white/20',
                        )}
                      />
                    ))}
                  </div>
                  <div className="mt-4 space-y-1.5 text-xs font-medium text-white/80">
                    <div className={checks.minLength ? 'text-white' : ''}>At least 8 characters</div>
                    <div className={checks.hasUppercase ? 'text-white' : ''}>Uppercase letter</div>
                    <div className={checks.hasLowercase ? 'text-white' : ''}>Lowercase letter</div>
                    <div className={checks.hasNumber ? 'text-white' : ''}>Number</div>
                    <div className={checks.hasSpecial ? 'text-white' : ''}>Special character</div>
                    <div className={checks.matches ? 'text-emerald-200' : ''}>Passwords match</div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={AUTH_ITEM_VARIANTS} className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">Account</p>
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
