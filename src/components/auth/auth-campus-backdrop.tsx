'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

/** Glass — higher opacity so copy reads clearly on busy campus photos */
export const AUTH_GLASS_PANEL =
  'rounded-2xl border border-white/80 bg-white/82 text-slate-800 shadow-[0_12px_44px_-8px_rgba(15,23,42,0.2)] backdrop-blur-xl backdrop-saturate-125 ring-1 ring-white/50 dark:border-white/15 dark:bg-slate-900/80 dark:text-slate-100 dark:ring-white/12'

export const AUTH_GLASS_FORM =
  'rounded-2xl border border-white/85 bg-white/88 text-slate-800 shadow-[0_16px_52px_-10px_rgba(15,23,42,0.24)] backdrop-blur-xl backdrop-saturate-125 ring-1 ring-white/55 dark:border-white/18 dark:bg-slate-900/85 dark:text-slate-100 dark:ring-white/14'

/** Framer Motion hover preset for sign-in glass cards */
export const SIGN_IN_MAGIC_HOVER = {
  y: -8,
  scale: 1.02,
  transition: { type: 'spring' as const, stiffness: 420, damping: 24 },
}

export const SIGN_IN_MAGIC_CARD_SHELL =
  'group relative overflow-hidden rounded-2xl will-change-transform [transform:translateZ(0)]'

/** Light sweep — render after card content so it paints above the glass */
export const SIGN_IN_MAGIC_SHINE =
  'pointer-events-none absolute inset-0 z-[2] rounded-2xl -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition duration-700 ease-out group-hover:translate-x-full group-hover:opacity-100'

export const SIGN_IN_MAGIC_AURA =
  'pointer-events-none absolute -inset-px z-0 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-sky-500/15 to-indigo-400/12 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100'

/** Hero titles — emerald (e.g. “Join Academia” on register) */
export const AUTH_GREEN_HEADLINE_CLASS =
  'text-balance font-bold tracking-tight text-emerald-600 drop-shadow-[0_2px_10px_rgba(0,0,0,0.38)] dark:text-emerald-400'

/** “Welcome back” on sign-in — white for contrast on campus photo */
export const AUTH_WELCOME_HEADLINE_CLASS =
  'text-balance font-bold tracking-tight text-white drop-shadow-[0_2px_22px_rgba(0,0,0,0.55),0_1px_4px_rgba(0,0,0,0.45)]'

export const SIGN_IN_LOGO_SURFACE =
  'border border-slate-200/90 bg-white shadow-[0_4px_24px_-4px_rgba(15,23,42,0.1)] ring-2 ring-emerald-500/18 dark:border-slate-700/90 dark:bg-slate-900/80 dark:ring-emerald-400/22'

/** Icons, inline links, list bullets on auth screens */
export const AUTH_ACCENT_ICON = 'text-sky-600 dark:text-sky-400'

export const AUTH_ACCENT_TEXT = 'text-sky-700 dark:text-sky-300'

/** Inputs on frosted auth forms */
export const AUTH_FORM_INPUT_CLASS =
  'border-slate-200/90 bg-white/92 text-slate-900 shadow-sm backdrop-blur-sm transition-all duration-200 focus-visible:border-sky-500 focus-visible:ring-sky-500/25 md:text-sm dark:border-white/15 dark:bg-slate-950/70 dark:text-slate-100'

/** Primary CTA — sky scale (accessible, contemporary) */
export const AUTH_PRIMARY_BUTTON_CLASS =
  'w-full rounded-lg bg-sky-600 py-6 text-base font-semibold text-white shadow-md shadow-sky-950/20 transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-55 sm:py-5 dark:bg-sky-500 dark:hover:bg-sky-600'

/** Side “analytics / tip” card on login & register */
export const AUTH_CTA_CARD_CLASS =
  'border border-white/35 bg-sky-800/82 p-5 text-white shadow-lg shadow-sky-950/25 backdrop-blur-xl sm:p-6 hover:border-teal-300/35 hover:shadow-[0_20px_48px_-12px_rgba(20,184,166,0.2),0_20px_48px_-12px_rgba(0,0,0,0.25)] dark:bg-sky-900/75'

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
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Always drawn: sign-in still looks redesigned if /sign-in-campus.png is missing */}
        <div
          className="absolute inset-0 bg-[linear-gradient(152deg,#0b1220_0%,#132e4a_26%,#1e4d72_52%,#3b6f9a_72%,#8eb8d8_92%,#d4e8f5_100%)]"
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
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-950/48 via-slate-900/32 to-slate-950/52 dark:from-slate-950/65 dark:via-slate-900/45 dark:to-slate-950/70"
          aria-hidden
        />
      </div>
      <div className="relative z-0 flex w-full flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        {children}
      </div>
    </div>
  )
}
