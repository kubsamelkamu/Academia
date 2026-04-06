'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Key, Lock, Shield } from 'lucide-react'
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
    if (!newPassword) return 'bg-slate-300 dark:bg-slate-600'
    if (passwordStrength === 0) return 'bg-red-500'
    if (passwordStrength === 1) return 'bg-orange-500'
    if (passwordStrength === 2) return 'bg-yellow-500'
    return 'bg-green-500'
  }, [passwordStrength, newPassword])

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
            className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ED5F45] to-[#F47A64] shadow-lg shadow-[#ED5F45]/30 sm:h-24 sm:w-24"
            whileHover={{ scale: 1.06, rotate: -4 }}
            whileTap={{ scale: 0.94 }}
          >
            <Shield className="h-10 w-10 text-white sm:h-11 sm:w-11" />
          </motion.div>
          <h1 className={cn('mb-3 text-4xl sm:text-5xl md:text-6xl', AUTH_WELCOME_HEADLINE_CLASS)}>Set a new password</h1>
          <p className="mx-auto max-w-lg text-pretty text-base font-medium text-white/90 drop-shadow-sm sm:text-lg">
            Step 3 of 3 — choose a strong password for {email || 'your account'}.
          </p>
        </motion.div>

        <div className="grid items-stretch gap-8 lg:grid-cols-[1fr_420px]">
          <motion.div className="order-2 space-y-6 lg:order-1" variants={AUTH_SLIDE_LEFT_VARIANTS}>
            <AuthTiltCard>
              <div className="relative overflow-hidden rounded-[2.5rem] border border-[#ED5F45]/20 bg-slate-950/40 p-8 shadow-2xl backdrop-blur-xl">
                <div className="absolute inset-x-0 top-0 h-1 bg-[#ED5F45] opacity-90" />
                <h3 className="mb-6 flex items-center gap-3 text-lg font-black uppercase tracking-tight text-white sm:text-xl">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ED5F45]/30 bg-[#ED5F45]/20">
                    <Key className="h-5 w-5 text-[#ED5F45]" />
                  </span>
                  Password guidance
                </h3>
                <ul className="space-y-3 text-sm font-medium text-slate-100 sm:text-base">
                  <li>• At least 8 characters</li>
                  <li>• Upper and lowercase letters</li>
                  <li>• Numbers and a special character</li>
                </ul>
              </div>
            </AuthTiltCard>

            <AuthTiltCard>
              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur-xl dark:bg-slate-950/50">
                <div className="flex items-center justify-between text-sm font-bold text-white">
                  <span className="text-white/80">Strength</span>
                  <span>{strengthLabel}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((segment) => (
                    <div
                      key={segment}
                      className={cn(
                        'h-2 rounded-full transition-colors',
                        passwordStrength > segment ? strengthColor : 'bg-white/20'
                      )}
                    />
                  ))}
                </div>
                <div className="mt-4 space-y-1.5 text-xs font-medium text-white/75">
                  <div className={checks.minLength ? 'text-emerald-300' : ''}>At least 8 characters</div>
                  <div className={checks.hasUppercase ? 'text-emerald-300' : ''}>Uppercase letter</div>
                  <div className={checks.hasLowercase ? 'text-emerald-300' : ''}>Lowercase letter</div>
                  <div className={checks.hasNumber ? 'text-emerald-300' : ''}>Number</div>
                  <div className={checks.hasSpecial ? 'text-emerald-300' : ''}>Special character</div>
                  <div className={checks.matches ? 'text-emerald-300' : ''}>Passwords match</div>
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
                      <Lock className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                      Reset password
                    </h2>
                    <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                      For <strong>{email || 'your account'}</strong>
                    </p>
                    <div className="mt-6">
                      <ForgotPasswordProgress
                        currentStep="reset"
                        stepLinks={{
                          request: '/forgot-password',
                          verify: '/forgot-password/verify',
                        }}
                      />
                    </div>
                  </div>

                  <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                    <AnimatePresence>
                      {error ? (
                        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                          <Alert variant="destructive" className="rounded-xl border-[#ED5F45]/20 bg-[#ED5F45]/5 text-[#ED5F45]">
                            <AlertDescription className="text-xs font-bold">{error}</AlertDescription>
                          </Alert>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    <div className="space-y-2">
                      <Label
                        htmlFor="newPassword"
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
                      >
                        <Lock className={cn('h-3.5 w-3.5', AUTH_ACCENT_ICON)} />
                        New password
                      </Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword ? 'text' : 'password'}
                          {...form.register('newPassword')}
                          placeholder="Strong password"
                          className={cn('h-12 rounded-xl border-2 pr-12', AUTH_FORM_INPUT_CLASS)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2"
                          onClick={() => setShowPassword((v) => !v)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {form.formState.errors.newPassword ? (
                        <p className="text-[11px] font-bold text-destructive">{form.formState.errors.newPassword.message}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="confirmPassword"
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
                      >
                        <Lock className={cn('h-3.5 w-3.5', AUTH_ACCENT_ICON)} />
                        Confirm
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          {...form.register('confirmPassword')}
                          placeholder="Repeat password"
                          className={cn('h-12 rounded-xl border-2 pr-12', AUTH_FORM_INPUT_CLASS)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {form.formState.errors.confirmPassword ? (
                        <p className="text-[11px] font-bold text-destructive">
                          {form.formState.errors.confirmPassword.message}
                        </p>
                      ) : null}
                    </div>

                    <Button
                      type="submit"
                      className={cn(AUTH_PRIMARY_BUTTON_CLASS, 'h-14 text-base font-black uppercase tracking-widest')}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Resetting…' : 'Reset password'}
                    </Button>

                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                      <Link href="/forgot-password/verify" className="flex items-center gap-1 text-[#ED5F45] hover:underline">
                        <ArrowLeft className="h-4 w-4" />
                        Verify step
                      </Link>
                      <Link href="/login" className="text-[#ED5F45] hover:underline">
                        Sign in
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
