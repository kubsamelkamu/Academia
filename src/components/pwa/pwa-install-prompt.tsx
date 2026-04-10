"use client"

/**
 * PwaInstallPrompt
 * ─────────────────────────────────────────────────────────────────────────────
 * Listens for the browser's `beforeinstallprompt` event and shows a custom
 * install prompt UI when the PWA is installable and the user hasn't dismissed
 * it recently.
 *
 * Behaviour
 * • Small screens (< sm / 640 px): slides up as a bottom sheet.
 * • Larger screens (sm+): appears as a centered dialog.
 * • "Install app" triggers the deferred native browser prompt; the modal closes
 *   regardless of whether the user accepts or declines the install.
 * • "Not now" / close (×) / clicking outside records a dismissal timestamp in
 *   localStorage and suppresses the prompt for PWA_DISMISS_DAYS days.
 * • Already-installed PWAs (display-mode: standalone) are silently skipped.
 *
 * Integration
 * • This component is rendered inside `src/app/providers.tsx` so it appears on
 *   every route for all users without requiring any per-page wiring.
 * • No tenant IDs or domains are hard-coded; the component is fully stateless
 *   with respect to multi-tenancy.
 */

import { useEffect, useRef, useState } from "react"
import { Download, X } from "lucide-react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// ── constants ──────────────────────────────────────────────────────────────

/** localStorage key that holds the ISO timestamp of the last dismissal. */
const STORAGE_KEY = "academia-pwa-prompt-dismissed-at"

/** Number of days to suppress the prompt after a user dismissal. */
const PWA_DISMISS_DAYS = 7

// ── types ─────────────────────────────────────────────────────────────────

/**
 * The `BeforeInstallPromptEvent` is not yet part of the official TypeScript
 * DOM lib.  We extend `Event` with only the members we actually use.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
  prompt(): Promise<void>
}

// ── helpers ────────────────────────────────────────────────────────────────

/**
 * Returns `true` when the user dismissed the prompt within the last
 * `PWA_DISMISS_DAYS` days (or when the stored value cannot be parsed).
 */
function isDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const dismissedAt = new Date(raw).getTime()
    if (Number.isNaN(dismissedAt)) return false
    return Date.now() - dismissedAt < PWA_DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    // localStorage unavailable (e.g. private browsing with strict settings).
    return false
  }
}

/** Persist the current timestamp as the most-recent dismissal time. */
function recordDismissal(): void {
  try {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString())
  } catch {
    // Ignore – quota exceeded or storage blocked.
  }
}

// ── component ──────────────────────────────────────────────────────────────

export function PwaInstallPrompt() {
  const [open, setOpen] = useState(false)
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Skip on the server (should never run, but guard for SSR safety).
    if (typeof window === "undefined") return

    // Do not show if the user dismissed recently.
    if (isDismissedRecently()) return

    // Do not show if the PWA is already running in standalone / installed mode.
    if (window.matchMedia("(display-mode: standalone)").matches) return

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the browser's default mini-infobar from appearing (Chrome/Android).
      e.preventDefault()
      // Save the event so we can re-trigger it from our own UI.
      deferredPromptRef.current = e as BeforeInstallPromptEvent
      setOpen(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  /** "Install app" button: show the native install prompt then close. */
  const handleInstall = async () => {
    const prompt = deferredPromptRef.current
    if (!prompt) return
    // Close our custom UI first so the native prompt is unobstructed.
    setOpen(false)
    await prompt.prompt()
    // The event is consumed after one call to prompt(); clear the ref.
    deferredPromptRef.current = null
  }

  /** "Not now" / close / outside-click: record suppression and hide. */
  const handleDismiss = () => {
    recordDismissal()
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Treat any programmatic close (e.g. Escape key) as a dismissal.
        if (!next) handleDismiss()
      }}
    >
      <DialogContent
        /**
         * Layout strategy
         * ───────────────
         * • Default (mobile-first): anchor to the bottom of the viewport —
         *   bottom sheet style with slide-up/down animation.
         * • sm+ breakpoint: revert to the standard centered dialog positioning.
         *
         * We override the centering transforms that DialogContent applies by
         * default; tailwind-merge (inside cn()) keeps the last conflicting
         * utility, so the overrides below win on mobile and the sm: variants
         * restore the default centred layout on wider screens.
         */
        className={[
          // ── Mobile: bottom sheet ──────────────────────────────────────────
          "bottom-0 top-auto left-0 right-0",
          "translate-x-0 translate-y-0",
          "w-full max-w-full",
          "rounded-t-2xl rounded-b-none",
          // Slide animation for the bottom sheet.
          "data-[state=open]:slide-in-from-bottom-4",
          "data-[state=closed]:slide-out-to-bottom-4",
          // Cancel the default zoom animation on mobile.
          "data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100",
          // ── Desktop / tablet (sm+): centred dialog ────────────────────────
          "sm:bottom-auto sm:left-[50%] sm:top-[50%]",
          "sm:translate-x-[-50%] sm:translate-y-[-50%]",
          "sm:max-w-md sm:w-full",
          "sm:rounded-2xl",
          // Restore default zoom animation on larger screens.
          "sm:data-[state=open]:slide-in-from-bottom-0",
          "sm:data-[state=closed]:slide-out-to-bottom-0",
        ].join(" ")}
        // Hide the default close button; we render our own in the header.
        showCloseButton={false}
        onPointerDownOutside={(e) => {
          // Clicking outside counts as a dismissal (records suppression).
          e.preventDefault()
          handleDismiss()
        }}
        onEscapeKeyDown={() => {
          // Escape key also counts as a dismissal.
          handleDismiss()
        }}
        // Accessibility: describe the purpose of this dialog.
        aria-label="Install Academia app"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <DialogHeader className="pb-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* App icon from the PWA manifest icon set */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/icon-192x192.png"
                alt="Academia app icon"
                width={48}
                height={48}
                className="rounded-xl shrink-0"
              />
              <div>
                <DialogTitle className="text-base leading-snug">
                  Install Academia
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  Academic Project Management Platform
                </DialogDescription>
              </div>
            </div>

            {/* Close / dismiss button */}
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Dismiss install prompt"
                onClick={handleDismiss}
                className="shrink-0 -mt-1 -mr-1"
              >
                <X className="size-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          Add Academia to your home screen for quick access, offline support,
          and a full-screen experience — no app store required.
        </p>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={handleDismiss}
          >
            Not now
          </Button>
          <Button
            size="sm"
            className="w-full sm:w-auto"
            onClick={handleInstall}
          >
            <Download className="size-4" />
            Install app
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
