'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AuthCampusBackdrop,
  AUTH_PRIMARY_BUTTON_CLASS,
  AUTH_WELCOME_HEADLINE_CLASS,
} from '@/components/auth/auth-campus-backdrop'
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
    <AuthCampusBackdrop>
      <motion.div
        className="mx-auto w-full max-w-5xl"
        variants={AUTH_CONTAINER_VARIANTS}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="mb-10 text-center" variants={AUTH_ITEM_VARIANTS}>
          <motion.div
            className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ED5F45] to-[#F47A64] shadow-lg shadow-[#ED5F45]/30"
            whileHover={{ scale: 1.06, rotate: -4 }}
            whileTap={{ scale: 0.94 }}
          >
            <ShieldAlert className="h-10 w-10 text-white" />
          </motion.div>
          <h1 className={cn('mb-3 text-3xl sm:text-4xl md:text-5xl', AUTH_WELCOME_HEADLINE_CLASS)}>
            Account suspended
          </h1>
          <p className="text-pretty text-base font-medium text-slate-600 sm:text-lg">{description}</p>
        </motion.div>

        <motion.div variants={AUTH_ITEM_VARIANTS}>
          <AuthTiltCard>
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white shadow-2xl backdrop-blur-2xl dark:bg-slate-900">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#ED5F45] via-[#F47A64] to-[#ED5F45]" />
              <div className="space-y-4 p-8 sm:p-10">
                <Alert className="rounded-xl border-[#ED5F45]/25 bg-[#ED5F45]/5">
                  <AlertDescription className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Login is blocked while the institution is inactive. A Department Head must submit the verification
                    document and an admin must review it.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button asChild className={cn(AUTH_PRIMARY_BUTTON_CLASS, 'h-12 flex-1 sm:flex-none')}>
                    <Link href="/login">Back to login</Link>
                  </Button>
                  <Button asChild variant="outline" className="h-12 flex-1 border-2 border-[#ED5F45]/30 font-bold text-[#ED5F45] sm:flex-none">
                    <a href="mailto:support@academia.et">Contact support</a>
                  </Button>
                </div>

                <p className="text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                  If you believe this is a mistake, contact support or your platform admin to reactivate the institution.
                </p>
              </div>
            </div>
          </AuthTiltCard>
        </motion.div>
      </motion.div>
    </AuthCampusBackdrop>
  )
}
