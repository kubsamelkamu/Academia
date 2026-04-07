'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

/** Glass panel — feature list cards */
export const AUTH_GLASS_PANEL =
  'rounded-2xl border border-white/70 bg-white/80 text-slate-800 shadow-[0_12px_44px_-8px_rgba(15,23,42,0.18)] backdrop-blur-xl backdrop-saturate-125 ring-1 ring-white/50 dark:border-white/12 dark:bg-slate-900/80 dark:text-slate-100 dark:ring-white/10'

/** Glass form card */
export const AUTH_GLASS_FORM =
  'rounded-2xl border border-white/80 bg-white/92 text-slate-800 shadow-[0_16px_52px_-10px_rgba(15,23,42,0.22)] backdrop-blur-xl backdrop-saturate-125 ring-1 ring-white/55 dark:border-white/15 dark:bg-slate-900/88 dark:text-slate-100 dark:ring-white/12'

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
  'text-balance font-black tracking-tight bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]'

/** Invitation shell headline when not on glass / campus (readable on light UI) */
export const AUTH_GREEN_HEADLINE_CLASS = AUTH_BRAND_HEADLINE_CLASS

/** "Welcome back" headline — white on campus photo */
export const AUTH_WELCOME_HEADLINE_CLASS =
  'text-balance font-black tracking-tight bg-gradient-to-r from-emerald-400 via-green-500 to-teal-400 bg-clip-text text-transparent drop-shadow-[0_2px_22px_rgba(0,0,0,0.6),0_1px_4px_rgba(0,0,0,0.5)]'

/** University logo circle */
export const SIGN_IN_LOGO_SURFACE =
  'border-2 border-[#ED5F45]/40 bg-white shadow-lg ring-4 ring-[#ED5F45]/15 dark:border-[#ED5F45]/25 dark:bg-slate-900/80 dark:ring-[#ED5F45]/20'

/** Icons and inline accents — brand orange */
export const AUTH_ACCENT_ICON = 'text-[#ED5F45] dark:text-[#ED5F45]'

export const AUTH_ACCENT_TEXT = 'text-[#ED5F45] dark:text-[#F47A64]'

/** Inputs — brand orange focus ring */
export const AUTH_FORM_INPUT_CLASS =
  'border-slate-200/90 bg-white/95 text-slate-900 shadow-sm backdrop-blur-sm transition-all duration-200 focus-visible:border-[#ED5F45] focus-visible:ring-[#ED5F45]/25 md:text-sm dark:border-white/12 dark:bg-slate-950/70 dark:text-slate-100 dark:focus-visible:border-[#ED5F45] dark:focus-visible:ring-[#ED5F45]/25'

/** Primary CTA button — brand orange gradient */
export const AUTH_PRIMARY_BUTTON_CLASS =
  'relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#ED5F45] via-[#F47A64] to-[#ED5F45] py-6 text-base font-bold text-white transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-[#ED5F45]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED5F45]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-55 sm:py-5 before:absolute before:inset-0 before:-translate-x-full before:skew-x-12 before:bg-white/15 before:transition-transform before:duration-700 hover:before:translate-x-full'

/** Analytics side card — rich brand tones */
export const AUTH_CTA_CARD_CLASS =
  'border border-[#ED5F45]/25 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 p-5 text-white backdrop-blur-xl sm:p-6 hover:border-[#ED5F45]/40'

type AuthCampusBackdropProps = {
  children: ReactNode
  className?: string
}

export function AuthCampusBackdrop({ children, className }: AuthCampusBackdropProps) {
  const [campusPhotoOk, setCampusPhotoOk] = useState(true)

  return (
    <div
      className={cn(
        'relative isolate flex w-full min-h-[calc(100dvh-9rem)] flex-1 flex-col overflow-hidden sm:min-h-[calc(100dvh-8rem)]',
        className
      )}
    >
      {/* ── Background ── */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Fallback gradient — brand orange tones */}
        <div
          className="absolute inset-0 bg-[linear-gradient(152deg,#1e293b_0%,#334155_22%,#475569_44%,#ED5F45_100%)]"
          aria-hidden
        />
        {campusPhotoOk ? (
          <Image
            src="/Auth background.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_30%] sm:object-[center_28%] lg:object-center opacity-60"
            aria-hidden
            onError={() => setCampusPhotoOk(false)}
          />
        ) : null}
        {/* Overlay — Scrim */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-900/40 to-slate-950/80 dark:from-slate-950/80 dark:via-slate-950/60 dark:to-slate-950/90"
          aria-hidden
        />
        {/* Subtle brand shimmer at top */}
        <div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ED5F45]/40 to-transparent"
          aria-hidden
        />
      </div>

      <div className="relative z-0 flex w-full flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        {children}
      </div>
    </div>
  )
}
