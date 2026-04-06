'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowRight, KeyRound, Mail, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import {
  AuthCampusBackdrop,
  AUTH_ACCENT_ICON,
  AUTH_FORM_INPUT_CLASS,
  AUTH_WELCOME_HEADLINE_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
} from '@/components/auth/auth-campus-backdrop'
import { cn } from '@/lib/utils'
import { AuthTiltCard, AUTH_CONTAINER_VARIANTS, AUTH_ITEM_VARIANTS } from '@/components/auth/auth-tilt-card'

function ForgotPasswordPageContent() {
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

      toast.success('Code Sent', {
        icon: <Mail className="w-4 h-4 text-[#ED5F45]" />,
        description: 'Verification code has been dispatched to your inbox.',
      })

      router.push(`/forgot-password/verify?email=${encodeURIComponent(normalizedEmail)}`)
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to request password reset'))
    } finally {
      setRequestLoading(false)
    }
  }

  return (
    <AuthCampusBackdrop>
      <motion.div
        className="mx-auto w-full max-w-2xl"
        variants={AUTH_CONTAINER_VARIANTS}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="mb-10 text-center" variants={AUTH_ITEM_VARIANTS}>
          <motion.div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ED5F45] to-[#F47A64] shadow-lg shadow-[#ED5F45]/30"
            whileHover={{ scale: 1.06, rotate: -4 }}
            whileTap={{ scale: 0.94 }}
          >
            <KeyRound className="h-10 w-10 text-white" />
          </motion.div>
          <h1 className={cn('mb-3 text-4xl sm:text-5xl', AUTH_WELCOME_HEADLINE_CLASS)}>
            Recovery Access
          </h1>
          <p className="mx-auto max-w-md text-pretty text-base text-white/90 drop-shadow-sm font-medium">
            Retrieve your account access securely. Step 1 of 3.
          </p>
        </motion.div>

        <motion.div variants={AUTH_ITEM_VARIANTS}>
          <AuthTiltCard>
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white dark:bg-slate-900 shadow-2xl backdrop-blur-2xl px-6 pb-10 pt-8 sm:px-10">
              <div className="absolute inset-x-0 top-0 h-1.5 w-full bg-gradient-to-r from-[#ED5F45] via-[#F47A64] to-[#ED5F45]" />
              
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Request Code</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium leading-snug">
                  Verification code will be sent to your inbox.
                </p>
                <div className="mt-6">
                  <ForgotPasswordProgress currentStep="request" />
                </div>
              </div>

              <form className="space-y-5" onSubmit={requestForm.handleSubmit(onRequest)}>
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                      <Alert variant="destructive" className="rounded-xl border-[#ED5F45]/20 bg-[#ED5F45]/5 text-[#ED5F45] py-2 px-3">
                        <AlertDescription className="text-xs font-bold">{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    <Mail className={cn('h-3.5 w-3.5', AUTH_ACCENT_ICON)} />
                    Email Identity
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@university.edu"
                    {...requestForm.register('email')}
                    className={cn(AUTH_FORM_INPUT_CLASS, "h-12 rounded-xl border-2")}
                  />
                  {requestForm.formState.errors.email && (
                    <p className="text-[11px] font-bold text-destructive px-1">{requestForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="pt-2">
                  <Button type="submit" className={cn(AUTH_PRIMARY_BUTTON_CLASS, "h-14 text-base font-black uppercase tracking-widest")} disabled={requestLoading}>
                    {requestLoading ? (
                      <span className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        DISPATCHING...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-3">
                        Send Recovery Code
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    )}
                  </Button>
                </div>

                <div className="text-center pt-2">
                  <Link href="/login" className="inline-flex items-center gap-2 text-[10px] font-black text-[#ED5F45] hover:underline uppercase tracking-widest">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Sign In
                  </Link>
                </div>
              </form>
            </div>
          </AuthTiltCard>
        </motion.div>
      </motion.div>
    </AuthCampusBackdrop>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthCampusBackdrop>
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-white/50" />
            <p className="text-sm font-medium text-white/90 drop-shadow">Loading Recovery Service…</p>
          </div>
        </AuthCampusBackdrop>
      }
    >
      <ForgotPasswordPageContent />
    </Suspense>
  )
}
