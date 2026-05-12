'use client'

import Image from 'next/image';
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
import { AUTH_FORM_COLUMN_WRAP, AUTH_FORM_INPUT_CLASS, AUTH_MARKETING_COLUMN_WRAP, AUTH_PAGE_WRAP, AUTH_PRIMARY_BUTTON_CLASS, AUTH_SPLIT_CARD_GRID } from '@/components/auth/auth-campus-backdrop'
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

              <motion.div variants={AUTH_ITEM_VARIANTS} className="mb-8 space-y-2">
                <h1 className="text-balance text-2xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Recovery Access</h1>
                <p className="max-w-md text-sm leading-6 text-slate-600">
                  Retrieve your account access securely. Step 1 of 3.
                </p>
              </motion.div>

              <div className="mb-6">
                <ForgotPasswordProgress currentStep="request" />
              </div>

              <form className="space-y-5" onSubmit={requestForm.handleSubmit(onRequest)}>
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <Alert variant="destructive" className="rounded-xl py-2.5">
                        <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@university.edu"
                    {...requestForm.register('email')}
                    className={cn(AUTH_FORM_INPUT_CLASS, 'h-12 rounded-xl')}
                  />
                  {requestForm.formState.errors.email && (
                    <p className="text-xs font-medium text-destructive">{requestForm.formState.errors.email.message}</p>
                  )}
                </div>

                <Button type="submit" className={cn(AUTH_PRIMARY_BUTTON_CLASS, 'h-12 rounded-xl text-sm font-semibold')} disabled={requestLoading}>
                  {requestLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending Code...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Send Recovery Code
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>

                <div className="text-center pt-1">
                  <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-[#ED5F45] hover:underline">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Sign In
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
                    <h2 className="text-xl font-semibold text-white">Request Code</h2>
                  </div>
                  <p className="text-sm leading-6 text-white/90">
                    Verification code will be sent to your inbox.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
                  <h3 className="text-xl font-semibold text-white">Secure & protected</h3>
                  <p className="mt-3 text-sm leading-6 text-white/90">
                    Your recovery code protects access to your academic workspace.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </AuthTiltCard>
      </motion.div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-200">
          <Loader2 className="h-10 w-10 animate-spin text-[#ED5F45]" aria-hidden />
        </div>
      }
    >
      <ForgotPasswordPageContent />
    </Suspense>
  )
}
