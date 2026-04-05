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

/** Hover glow aura — emerald green */
export const SIGN_IN_MAGIC_AURA =
  'pointer-events-none absolute -inset-px z-0 rounded-2xl bg-gradient-to-br from-emerald-500/22 via-green-400/15 to-teal-400/10 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100'

/** "Join Academia" style headline */
export const AUTH_GREEN_HEADLINE_CLASS =
  'text-balance font-black tracking-tight text-emerald-600 drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] dark:text-emerald-400'

/** "Welcome back" headline — white on campus photo */
export const AUTH_WELCOME_HEADLINE_CLASS =
  'text-balance font-black tracking-tight bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent drop-shadow-[0_2px_22px_rgba(0,0,0,0.55),0_1px_4px_rgba(0,0,0,0.45)]'

/** University logo circle */
export const SIGN_IN_LOGO_SURFACE =
  'border-2 border-emerald-400/40 bg-white shadow-lg ring-4 ring-emerald-500/15 dark:border-emerald-400/25 dark:bg-slate-900/80 dark:ring-emerald-400/20'

/** Icons and inline accents — emerald */
export const AUTH_ACCENT_ICON = 'text-emerald-600 dark:text-emerald-400'

export const AUTH_ACCENT_TEXT = 'text-emerald-700 dark:text-emerald-300'

/** Inputs — emerald focus ring */
export const AUTH_FORM_INPUT_CLASS =
  'border-slate-200/90 bg-white/95 text-slate-900 shadow-sm backdrop-blur-sm transition-all duration-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/25 md:text-sm dark:border-white/12 dark:bg-slate-950/70 dark:text-slate-100 dark:focus-visible:border-emerald-400 dark:focus-visible:ring-emerald-400/25'

/** Primary CTA button — emerald gradient */
export const AUTH_PRIMARY_BUTTON_CLASS =
  'relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 py-6 text-base font-bold text-white transition-all duration-200 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-55 sm:py-5 before:absolute before:inset-0 before:-translate-x-full before:skew-x-12 before:bg-white/15 before:transition-transform before:duration-700 hover:before:translate-x-full'

/** Analytics side card — rich emerald/teal dark tone */
export const AUTH_CTA_CARD_CLASS =
  'border border-emerald-400/25 bg-gradient-to-br from-emerald-900/90 via-green-900/85 to-teal-900/80 p-5 text-white backdrop-blur-xl sm:p-6 hover:border-emerald-300/40 dark:from-emerald-950/90 dark:via-green-950/85 dark:to-teal-950/80'

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
        {/* Fallback gradient — deep green-to-forest tones */}
        <div
          className="absolute inset-0 bg-[linear-gradient(152deg,#052e16_0%,#064e3b_22%,#065f46_44%,#047857_62%,#059669_80%,#a7f3d0_100%)]"
          aria-hidden
        />
        {campusPhotoOk ? (
          <Image
            src="/image.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_30%] sm:object-[center_28%] lg:object-center"
            aria-hidden
            onError={() => setCampusPhotoOk(false)}
          />
        ) : null}
        {/* Overlay — emerald-tinted dark scrim */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-950/50 via-emerald-950/30 to-slate-950/55 dark:from-slate-950/68 dark:via-emerald-950/40 dark:to-slate-950/72"
          aria-hidden
        />
        {/* Subtle green shimmer at top */}
        <div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"
          aria-hidden
        />
      </div>

      <div className="relative z-0 flex w-full flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        {children}
      </div>
    </div>
  )
}
