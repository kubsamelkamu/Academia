'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Glass panel — feature list cards */
export const AUTH_GLASS_PANEL =
  'rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-[0_12px_40px_-10px_rgba(15,23,42,0.18)] ring-1 ring-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800'

/** Glass form card */
export const AUTH_GLASS_FORM =
  'rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-[0_16px_52px_-14px_rgba(15,23,42,0.25)] ring-1 ring-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800'

/** Framer Motion hover preset for glass cards */
export const SIGN_IN_MAGIC_HOVER = {
  y: -6,
  scale: 1.015,
  transition: { type: 'spring' as const, stiffness: 400, damping: 28 },
}

export const SIGN_IN_MAGIC_CARD_SHELL =
  'group relative overflow-hidden rounded-2xl will-change-transform [transform:translateZ(0)]'

/** Shimmer sweep overlay */
export const SIGN_IN_MAGIC_SHINE =
  'pointer-events-none absolute inset-0 z-[2] rounded-2xl -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition duration-700 ease-out group-hover:translate-x-full group-hover:opacity-100'

/** Hover glow aura — brand orange */
export const SIGN_IN_MAGIC_AURA =
  'pointer-events-none absolute -inset-px z-0 rounded-2xl bg-gradient-to-br from-[#ED5F45]/22 via-[#F47A64]/15 to-orange-400/10 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100'

/** "Join Academia" style headline */
export const AUTH_BRAND_HEADLINE_CLASS =
  'text-balance font-semibold tracking-tight text-slate-900 dark:text-slate-100'

/** Invitation shell headline when not on glass / campus (readable on light UI) */
export const AUTH_GREEN_HEADLINE_CLASS = AUTH_BRAND_HEADLINE_CLASS

/** "Welcome back" headline — white on campus photo */
export const AUTH_WELCOME_HEADLINE_CLASS =
  'text-balance font-semibold tracking-tight text-slate-900 dark:text-slate-100'

/** University logo circle */
export const SIGN_IN_LOGO_SURFACE =
  'border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-800'

/** Icons and inline accents — brand orange */
export const AUTH_ACCENT_ICON = 'text-[#ED5F45] dark:text-[#F47A64]'

export const AUTH_ACCENT_TEXT = 'text-[#ED5F45] dark:text-[#F47A64]'

/** Inputs — brand orange focus ring */
export const AUTH_FORM_INPUT_CLASS =
  'border-slate-300 bg-white text-slate-900 shadow-sm transition-all duration-200 focus-visible:border-[#ED5F45] focus-visible:ring-[#ED5F45]/25 md:text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:border-[#F47A64] dark:focus-visible:ring-[#F47A64]/25'

/** Primary CTA button — brand orange gradient */
export const AUTH_PRIMARY_BUTTON_CLASS =
  'relative w-full overflow-hidden rounded-xl bg-[#ED5F45] py-6 text-base font-semibold text-white transition-all duration-200 hover:bg-[#D95840] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED5F45]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-55 sm:py-5'

/** Analytics side card — rich brand tones */
export const AUTH_CTA_CARD_CLASS =
  'border border-[#ED5F45]/20 bg-gradient-to-br from-[#B84530] via-[#D95840] to-[#ED5F45] p-5 text-white sm:p-6'

type AuthCampusBackdropProps = {
  children: ReactNode
  className?: string
}

export function AuthCampusBackdrop({ children, className }: AuthCampusBackdropProps) {
  return (
    <div
      className={cn(
        'relative isolate flex w-full min-h-[calc(100dvh-9rem)] flex-1 flex-col overflow-hidden bg-slate-200 sm:min-h-[calc(100dvh-8rem)]',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />

      <div className="relative z-0 flex w-full flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        {children}
      </div>
    </div>
  )
}
