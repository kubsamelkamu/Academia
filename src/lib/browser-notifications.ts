import type { Notification as AppNotification } from "@/types/notifications"

export type BrowserNotificationPermissionState = NotificationPermission | "unsupported"

const NOTIFICATION_SOUND_STORAGE_KEY = "academia:notification-sound-enabled"

let audioContextRef: AudioContext | null = null

function hasBrowserNotificationSupport(): boolean {
  return typeof window !== "undefined" && typeof window.Notification !== "undefined"
}

function hasNotificationSoundSupport(): boolean {
  return typeof window !== "undefined" && typeof window.AudioContext !== "undefined"
}

function getAudioContext(): AudioContext | null {
  if (!hasNotificationSoundSupport()) return null

  if (!audioContextRef) {
    audioContextRef = new window.AudioContext()
  }

  return audioContextRef
}

function resolveInternalHref(notification: AppNotification): string | null {
  const metadata = notification.metadata
  if (!metadata || typeof metadata !== "object") return null

  const record = metadata as Record<string, unknown>
  const candidate = record.href ?? record.path ?? record.url
  if (typeof candidate !== "string") return null
  if (!candidate.startsWith("/")) return null
  return candidate
}

export function getBrowserNotificationPermission(): BrowserNotificationPermissionState {
  if (!hasBrowserNotificationSupport()) return "unsupported"
  return window.Notification.permission
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationPermissionState> {
  if (!hasBrowserNotificationSupport()) return "unsupported"

  try {
    return await window.Notification.requestPermission()
  } catch {
    return window.Notification.permission
  }
}

export function getNotificationSoundEnabled(): boolean {
  if (typeof window === "undefined") return false

  try {
    return window.localStorage.getItem(NOTIFICATION_SOUND_STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

export function setNotificationSoundEnabled(enabled: boolean) {
  if (typeof window === "undefined") return

  try {
    if (enabled) {
      window.localStorage.setItem(NOTIFICATION_SOUND_STORAGE_KEY, "1")
    } else {
      window.localStorage.removeItem(NOTIFICATION_SOUND_STORAGE_KEY)
    }
  } catch {
    // ignore storage failures
  }
}

export async function enableNotificationSound(): Promise<"enabled" | "unsupported" | "blocked"> {
  if (!hasNotificationSoundSupport()) return "unsupported"

  const context = getAudioContext()
  if (!context) return "unsupported"

  try {
    if (context.state === "suspended") {
      await context.resume()
    }

    setNotificationSoundEnabled(true)
    return "enabled"
  } catch {
    return "blocked"
  }
}

export function disableNotificationSound() {
  setNotificationSoundEnabled(false)
}

export async function playNotificationSound(): Promise<boolean> {
  if (!getNotificationSoundEnabled()) return false

  const context = getAudioContext()
  if (!context) return false

  try {
    if (context.state === "suspended") {
      await context.resume()
    }

    const oscillator = context.createOscillator()
    const gainNode = context.createGain()
    const now = context.currentTime

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(880, now)
    oscillator.frequency.exponentialRampToValueAtTime(660, now + 0.18)

    gainNode.gain.setValueAtTime(0.0001, now)
    gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    oscillator.start(now)
    oscillator.stop(now + 0.24)

    return true
  } catch {
    return false
  }
}

export function showBrowserNotification(notification: AppNotification): boolean {
  if (!hasBrowserNotificationSupport()) return false
  if (window.Notification.permission !== "granted") return false

  const href = resolveInternalHref(notification) ?? "/dashboard/notifications"
  const browserNotification = new window.Notification(notification.title || "Notification", {
    body: notification.message || "You have a new notification.",
    tag: notification.id,
  })

  browserNotification.onclick = () => {
    window.focus()
    window.location.assign(href)
    browserNotification.close()
  }

  return true
}
