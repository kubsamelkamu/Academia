"use client"

import { useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AlertCircle, Clock } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { UserRole } from "@/config/navigation"
import type { Notification } from "@/types/notifications"
import { useMarkNotificationRead, useNotificationsSummary } from "@/lib/hooks/use-notifications"

const TOAST_SEEN_PREFIX = "academia:toast-seen-notification:"

function safeGetSessionStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null
  } catch {
    return null
  }
}

function resolveInternalHref(notification: Notification): string | null {
  const metadata = notification.metadata
  if (!metadata || typeof metadata !== "object") return null

  const record = metadata as Record<string, unknown>
  const candidate = record.href ?? record.path ?? record.url
  if (typeof candidate !== "string") return null
  if (!candidate.startsWith("/")) return null
  return candidate
}

function includesAny(haystack: string, needles: string[]): boolean {
  const lowered = haystack.toLowerCase()
  return needles.some((n) => lowered.includes(n))
}

function isVerificationReminder(notification: Notification): boolean {
  const text = `${notification.eventType} ${notification.title} ${notification.message}`

  // Prefer backend eventType, but fall back to title/message heuristics.
  if (includesAny(notification.eventType, ["reminder", "verification", "status_upload", "status-upload"])) {
    return true
  }

  if (includesAny(text, ["reminder"])) return true

  return includesAny(text, ["status", "verification"]) && includesAny(text, ["upload", "submit", "document", "file"])
}

function isTenantSuspension(notification: Notification): boolean {
  const text = `${notification.eventType} ${notification.title} ${notification.message}`

  if (includesAny(notification.eventType, ["suspend", "suspended", "inactive", "tenant_status"])) {
    return true
  }

  return includesAny(text, ["suspend", "suspended", "not active", "inactive", "account is not active"])
}

function pickNoticeTarget(recent: Notification[]): { kind: "suspension" | "reminder"; notification: Notification } | null {
  const unread = recent.filter((n) => n.status === "UNREAD")

  const suspension = unread.find(isTenantSuspension)
  if (suspension) return { kind: "suspension", notification: suspension }

  const reminder = unread.find(isVerificationReminder)
  if (reminder) return { kind: "reminder", notification: reminder }

  return null
}

export function TenantEnforcementNotice({ role, isAuthenticated }: { role: UserRole; isAuthenticated: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const markRead = useMarkNotificationRead()

  const summary = useNotificationsSummary({
    enabled: isAuthenticated && role === "department_head",
    refetchOnWindowFocus: true,
    staleTime: 0,
    refetchInterval: 60_000,
  })

  const target = useMemo(() => pickNoticeTarget(summary.data?.recent ?? []), [summary.data?.recent])

  const toastShownFor = useRef(new Set<string>())

  useEffect(() => {
    if (!target) return

    const id = target.notification.id

    if (toastShownFor.current.has(id)) return

    const storage = safeGetSessionStorage()
    const storageKey = `${TOAST_SEEN_PREFIX}${id}`
    if (storage?.getItem(storageKey) === "1") {
      toastShownFor.current.add(id)
      return
    }

    toast.message(target.notification.title, {
      description: target.notification.message,
    })

    toastShownFor.current.add(id)
    storage?.setItem(storageKey, "1")
  }, [target])

  if (role !== "department_head") return null
  if (!target) return null

  // Avoid banner duplication on the suspended page.
  if (pathname === "/account-suspended") return null

  const href =
    resolveInternalHref(target.notification) ??
    (target.kind === "suspension" ? "/account-suspended" : "/dashboard/verify-institution")

  const variant = target.kind === "suspension" ? "destructive" : "default"
  const Icon = target.kind === "suspension" ? AlertCircle : Clock

  const handleMarkRead = async () => {
    try {
      await markRead.mutateAsync(target.notification.id)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to dismiss notification")
    }
  }

  const handleGo = async () => {
    // Mark read first so the banner clears even if navigation is blocked.
    await handleMarkRead()
    router.push(href)
  }

  return (
    <Alert variant={variant} className="mb-4">
      <Icon className="h-4 w-4" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <AlertTitle className="truncate">{target.notification.title}</AlertTitle>
          <AlertDescription>
            <p className="text-sm">{target.notification.message}</p>
          </AlertDescription>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant={variant === "destructive" ? "destructive" : "default"} onClick={() => void handleGo()}>
            {target.kind === "suspension" ? "View status" : "Go to verification"}
          </Button>
          <Button type="button" variant="outline" onClick={() => void handleMarkRead()} disabled={markRead.isPending}>
            Dismiss
          </Button>
        </div>
      </div>

      {/* Fallback link for middle-click / open in new tab */}
      <Link href={href} className="sr-only">
        Open notification destination
      </Link>
    </Alert>
  )
}
