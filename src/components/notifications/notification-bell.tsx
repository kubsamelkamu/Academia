"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/store/auth-store"
import type { Notification, NotificationSeverity } from "@/types/notifications"
import { NotificationItem } from "@/components/notifications/notification-item"
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsSummary,
  useNotificationsUnreadCount,
} from "@/lib/hooks/use-notifications"
import {
  disableNotificationSound,
  enableNotificationSound,
  getBrowserNotificationPermission,
  getNotificationSoundEnabled,
  requestBrowserNotificationPermission,
  type BrowserNotificationPermissionState,
} from "@/lib/browser-notifications"
import {
  disablePushNotifications,
  getPushSetupState,
  getPushSetupStateSync,
  preparePushNotifications,
  type PushSetupState,
} from "@/lib/push-notifications"

interface NotificationBellProps {
  initialCount?: number
}

type StatusBadgeVariant = "secondary" | "outline" | "destructive"

const severityOrder: NotificationSeverity[] = ["HIGH", "MEDIUM", "LOW", "INFO"]

function resolveInternalHref(notification: Notification): string | null {
  const metadata = notification.metadata
  if (!metadata || typeof metadata !== "object") return null

  const record = metadata as Record<string, unknown>
  const candidate = record.href ?? record.path ?? record.url
  if (typeof candidate !== "string") return null
  if (!candidate.startsWith("/")) return null
  return candidate
}

function groupBySeverity(items: Notification[]): Array<{ severity: NotificationSeverity; items: Notification[] }> {
  const map = new Map<NotificationSeverity, Notification[]>()

  for (const item of items) {
    const current = map.get(item.severity) ?? []
    current.push(item)
    map.set(item.severity, current)
  }

  const result: Array<{ severity: NotificationSeverity; items: Notification[] }> = []
  for (const severity of severityOrder) {
    const group = map.get(severity)
    if (group?.length) result.push({ severity, items: group })
  }
  return result
}

function getBrowserAlertsStatus(permission: BrowserNotificationPermissionState): {
  label: string
  variant: StatusBadgeVariant
  description: string
} {
  if (permission === "granted") {
    return {
      label: "On",
      variant: "secondary",
      description: "Realtime notifications can appear as browser alerts while the app is open.",
    }
  }

  if (permission === "denied") {
    return {
      label: "Blocked",
      variant: "destructive",
      description: "Browser alerts are blocked for this site in your browser settings.",
    }
  }

  if (permission === "unsupported") {
    return {
      label: "Unsupported",
      variant: "outline",
      description: "This browser does not support the Notification API.",
    }
  }

  return {
    label: "Off",
    variant: "outline",
    description: "Enable browser alerts for realtime notifications in this tab session.",
  }
}

function getSoundStatus(soundEnabled: boolean): {
  label: string
  variant: StatusBadgeVariant
  description: string
} {
  if (soundEnabled) {
    return {
      label: "On",
      variant: "secondary",
      description: "A short chime will play when a realtime notification arrives.",
    }
  }

  return {
    label: "Off",
    variant: "outline",
    description: "Turn on a short sound for realtime notifications while the app is running.",
  }
}

function getPushStatus(pushState: PushSetupState): {
  label: string
  variant: StatusBadgeVariant
  description: string
} {
  if (pushState === "subscription-ready") {
    return {
      label: "Active",
      variant: "secondary",
      description: "This browser is registered for Web Push delivery when the tab is closed.",
    }
  }

  if (pushState === "missing-vapid") {
    return {
      label: "Needs Key",
      variant: "destructive",
      description: "Backend VAPID public key is missing, so Web Push cannot finish setup yet.",
    }
  }

  if (pushState === "denied") {
    return {
      label: "Blocked",
      variant: "destructive",
      description: "Web Push is blocked because browser notification permission is denied.",
    }
  }

  if (pushState === "unsupported") {
    return {
      label: "Unsupported",
      variant: "outline",
      description: "This browser does not support service workers or PushManager.",
    }
  }

  return {
    label: "Ready",
    variant: "outline",
    description: "Prepare a Web Push subscription for background delivery in this browser.",
  }
}

export function NotificationBell({ initialCount = 0 }: NotificationBellProps) {
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const isAuthenticated = Boolean(accessToken)
  const [browserPermission, setBrowserPermission] = useState<BrowserNotificationPermissionState>(() =>
    getBrowserNotificationPermission()
  )
  const [soundEnabled, setSoundEnabled] = useState(() => getNotificationSoundEnabled())
  const [pushState, setPushState] = useState<PushSetupState>(() => getPushSetupStateSync())
  const [isPreparingPush, setIsPreparingPush] = useState(false)
  const [isDisablingPush, setIsDisablingPush] = useState(false)

  const unread = useNotificationsUnreadCount({
    enabled: isAuthenticated,
    refetchOnWindowFocus: true,
    staleTime: 0,
  })

  const summary = useNotificationsSummary({
    enabled: isAuthenticated,
    refetchOnWindowFocus: true,
    staleTime: 0,
  })

  const markOne = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  const badgeCount = unread.data?.count ?? summary.data?.unread ?? initialCount

  const handleMarkAllRead = async () => {
    try {
      await markAll.mutateAsync()
      toast.success("All notifications marked as read")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to mark all as read")
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      await markOne.mutateAsync(id)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to mark notification as read")
    }
  }

  const handleOpenNotification = async (notification: Notification) => {
    const href = resolveInternalHref(notification) ?? "/dashboard/notifications"

    if (notification.status === "UNREAD") {
      try {
        await markOne.mutateAsync(notification.id)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to mark notification as read")
      }
    }

    router.push(href)
  }

  const handleEnableBrowserAlerts = async () => {
    const permission = await requestBrowserNotificationPermission()
    setBrowserPermission(permission)

    if (permission === "granted") {
      toast.success("Browser notifications enabled")
      return
    }

    if (permission === "denied") {
      toast.error("Browser notifications are blocked in this browser")
      return
    }

    if (permission === "unsupported") {
      toast.error("Browser notifications are not supported in this browser")
      return
    }

    toast.message("Browser notification permission was not changed")
  }

  const handleToggleNotificationSound = async () => {
    if (soundEnabled) {
      disableNotificationSound()
      setSoundEnabled(false)
      toast.message("Notification sound turned off")
      return
    }

    const result = await enableNotificationSound()
    if (result === "enabled") {
      setSoundEnabled(true)
      toast.success("Notification sound enabled")
      return
    }

    toast.error(
      result === "unsupported"
        ? "Notification sound is not supported in this browser"
        : "Notification sound could not be enabled until the browser allows audio"
    )
  }

  const refreshPushState = async () => {
    setPushState(await getPushSetupState())
  }

  const handlePreparePushNotifications = async () => {
    setIsPreparingPush(true)

    try {
      const nextState = await preparePushNotifications()
      setPushState(nextState)

      if (nextState === "subscription-ready") {
        toast.success("Push notifications are enabled for this browser")
        return
      }

      if (nextState === "missing-vapid") {
        toast.error("Push service worker is ready, but no VAPID public key is configured yet")
        return
      }

      if (nextState === "denied") {
        toast.error("Browser notification permission is blocked for push setup")
        return
      }

      if (nextState === "unsupported") {
        toast.error("Web Push is not supported in this browser")
        return
      }

      toast.message("Push setup was not completed")
    } catch {
      toast.error("Failed to prepare push notifications")
    } finally {
      setIsPreparingPush(false)
    }
  }

  const handleDisablePushNotifications = async () => {
    setIsDisablingPush(true)

    try {
      const nextState = await disablePushNotifications()
      setPushState(nextState)
      toast.message("Push notifications are disabled for this browser")
    } catch {
      toast.error("Failed to disable push notifications")
    } finally {
      setIsDisablingPush(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    void refreshPushState()
  }, [isAuthenticated])

  const recent: Notification[] = summary.data?.recent ?? []
  const grouped = groupBySeverity(recent)
  const browserAlertsStatus = getBrowserAlertsStatus(browserPermission)
  const soundStatus = getSoundStatus(soundEnabled)
  const pushStatus = getPushStatus(pushState)

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open || !isAuthenticated) return
        setBrowserPermission(getBrowserNotificationPermission())
        setSoundEnabled(getNotificationSoundEnabled())
        void refreshPushState()
        // Force an immediate refresh so the dropdown list matches the badge.
        void Promise.all([unread.refetch(), summary.refetch()])
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {badgeCount > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1"
            >
              {badgeCount > 99 ? "99+" : badgeCount}
            </Badge>
          ) : null}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[420px] overflow-hidden p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={badgeCount === 0 || unread.isFetching || summary.isFetching || markAll.isPending}
          >
            Mark all read
          </Button>
        </div>
        <DropdownMenuSeparator />

        <div
          className="max-h-[min(420px,var(--radix-dropdown-menu-content-available-height))] overflow-y-auto p-2"
          role="list"
        >
          {summary.isLoading || summary.isFetching ? (
            <div className="p-4 text-sm text-muted-foreground">Loading notifications…</div>
          ) : grouped.length ? (
            <div className="grid gap-3">
              {grouped.map((group) => (
                <div key={group.severity} className="grid gap-2">
                  <div className="px-2 pt-1 text-xs font-medium text-muted-foreground">
                    {group.severity}
                  </div>
                  {group.items.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onMarkRead={handleMarkRead}
                      onClick={handleOpenNotification}
                      compact
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">No unread notifications.</div>
          )}
        </div>

        <DropdownMenuSeparator />
        <div className="space-y-3 px-4 py-3">
          <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Browser Alerts</p>
                <Badge variant={browserAlertsStatus.variant}>{browserAlertsStatus.label}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{browserAlertsStatus.description}</p>
            </div>
            {browserPermission === "default" ? (
              <Button type="button" variant="outline" size="sm" onClick={handleEnableBrowserAlerts}>
                Enable
              </Button>
            ) : null}
          </div>

          <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Notification Sound</p>
                <Badge variant={soundStatus.variant}>{soundStatus.label}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{soundStatus.description}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleToggleNotificationSound}>
              {soundEnabled ? "Turn off" : "Enable"}
            </Button>
          </div>

          <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Web Push</p>
                <Badge variant={pushStatus.variant}>{pushStatus.label}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{pushStatus.description}</p>
            </div>
            {pushState === "subscription-ready" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDisablePushNotifications}
                disabled={isDisablingPush}
              >
                {isDisablingPush ? "Disabling..." : "Disable"}
              </Button>
            ) : pushState !== "unsupported" && pushState !== "denied" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePreparePushNotifications}
                disabled={isPreparingPush}
              >
                {isPreparingPush ? "Preparing..." : "Prepare"}
              </Button>
            ) : null}
          </div>
        </div>

        <DropdownMenuSeparator />
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xs text-muted-foreground">
              {browserPermission === "granted"
                ? badgeCount > 0
                  ? `Browser alerts on • ${badgeCount} unread`
                  : "Browser alerts on"
                : badgeCount > 0
                  ? `${badgeCount} unread`
                  : "You're all caught up"}
          </span>
          <Button asChild variant="secondary" size="sm">
            <Link href="/dashboard/notifications">View all</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
