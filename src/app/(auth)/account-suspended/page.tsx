'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert, Mail, BarChart3 } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AUTH_MARKETING_COLUMN_WRAP, AUTH_PAGE_WRAP, AUTH_PRIMARY_BUTTON_CLASS, AUTH_SPLIT_CARD_GRID } from '@/components/auth/auth-campus-backdrop'
import { AuthTiltCard, AUTH_CONTAINER_VARIANTS, AUTH_ITEM_VARIANTS } from '@/components/auth/auth-tilt-card'
import { cn } from '@/lib/utils'

export default function AccountSuspendedPage() {
  const tenantDomain = useAuthStore((s) => s.tenantDomain)

  const description = useMemo(() => {
    if (!tenantDomain) {
      return 'Your institution account is currently inactive because status verification is incomplete.'
    }
    return `Institution “${tenantDomain}” is currently inactive because status verification is incomplete.`
  }, [tenantDomain])

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
            <div className="flex min-h-0 flex-col justify-center bg-white px-4 py-9 sm:px-8 sm:py-10 lg:px-14 lg:py-12">
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

              <motion.div variants={AUTH_ITEM_VARIANTS} className="mb-8 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ED5F45]/10 text-[#ED5F45]">
                  <ShieldAlert className="h-6 w-6" aria-hidden />
                </div>
                <h1 className="text-balance text-2xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Account suspended</h1>
                <p className="max-w-md text-sm leading-6 text-slate-600">{description}</p>
              </motion.div>

              <motion.div variants={AUTH_ITEM_VARIANTS} className="space-y-4">
                <Alert className="rounded-xl border-[#ED5F45]/25 bg-[#ED5F45]/5">
                  <AlertDescription className="text-sm font-medium text-slate-700">
                    Login is blocked while the institution is inactive. A Department Head must submit the verification
                    document and an admin must review it.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button asChild className={cn(AUTH_PRIMARY_BUTTON_CLASS, 'h-12 flex-1 rounded-xl text-sm font-semibold sm:flex-none')}>
                    <Link href="/login">Back to login</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-12 flex-1 rounded-xl border-slate-300 text-sm font-medium text-slate-700 sm:flex-none"
                  >
                    <a href="mailto:support@academia.et">Contact support</a>
                  </Button>
                </div>

                <p className="text-center text-xs font-medium text-slate-500">
                  If you believe this is a mistake, contact support or your platform admin to reactivate the institution.
                </p>
              </motion.div>
            </div>

            <div className={AUTH_MARKETING_COLUMN_WRAP}>
              <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
              <div className="pointer-events-none absolute -left-20 bottom-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

              <motion.div variants={AUTH_ITEM_VARIANTS} className="relative z-10 mt-6 space-y-5 md:mt-10 md:space-y-6">
                <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <ShieldAlert className="h-5 w-5 text-white/90" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Why access is limited</h2>
                  </div>
                  <p className="text-sm leading-6 text-white/90">
                    Institutions must complete verification before students and staff can use Academia normally.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <Mail className="h-5 w-5 text-white/90" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Need help?</h3>
                  </div>
                  <p className="text-sm leading-6 text-white/90">
                    Email{' '}
                    <a href="mailto:support@academia.et" className="font-semibold underline underline-offset-2">
                      support@academia.et
                    </a>{' '}
                    or reach your platform administrator for reactivation.
                  </p>
                </div>
              </motion.div>

              <motion.div variants={AUTH_ITEM_VARIANTS} className="relative z-10 flex items-center gap-3 pb-2">
                <BarChart3 className="h-5 w-5 text-white/80" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
                  Academic integrity & compliance
                </p>
              </motion.div>
            </div>
          </div>
        </AuthTiltCard>
      </motion.div>
    </div>
  )
}
