import {
  getPushVapidPublicKey,
  subscribePushNotifications,
  unsubscribePushNotifications,
} from "@/lib/api/push-notifications"
import type { PushSubscriptionPayload } from "@/types/push-notifications"

export type PushSetupState =
  | "unsupported"
  | "default"
  | "denied"
  | "missing-vapid"
  | "service-worker-ready"
  | "subscription-ready"

const PUSH_SERVICE_WORKER_PATH = "/push-sw.js"

function toPushSubscriptionPayload(subscription: PushSubscription): PushSubscriptionPayload {
  const payload = subscription.toJSON() as PushSubscriptionPayload

  if (!payload.endpoint || !payload.keys?.p256dh || !payload.keys?.auth) {
    throw new Error("Push subscription payload is incomplete")
  }

  return {
    endpoint: payload.endpoint,
    expirationTime: payload.expirationTime ?? null,
    keys: {
      p256dh: payload.keys.p256dh,
      auth: payload.keys.auth,
    },
  }
}

function hasPushSupport(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  )
}

function base64UrlToArrayBuffer(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")
  const raw = window.atob(normalized)
  const result = new Uint8Array(raw.length)

  for (let index = 0; index < raw.length; index += 1) {
    result[index] = raw.charCodeAt(index)
  }

  return result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength)
}

export function getPushSetupStateSync(): PushSetupState {
  if (!hasPushSupport()) return "unsupported"

  if (window.Notification.permission === "denied") return "denied"
  if (window.Notification.permission === "default") return "default"

  return "service-worker-ready"
}

export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!hasPushSupport()) return null

  try {
    return await navigator.serviceWorker.register(PUSH_SERVICE_WORKER_PATH)
  } catch {
    return null
  }
}

export async function fetchVapidPublicKey(): Promise<string | null> {
  try {
    const data = await getPushVapidPublicKey()
    return typeof data.publicKey === "string" && data.publicKey.trim() ? data.publicKey : null
  } catch {
    return null
  }
}

export async function getPushSetupState(): Promise<PushSetupState> {
  if (!hasPushSupport()) return "unsupported"

  if (window.Notification.permission === "denied") return "denied"
  if (window.Notification.permission === "default") return "default"

  const registration = await registerPushServiceWorker()
  if (!registration) return "unsupported"

  const subscription = await registration.pushManager.getSubscription()
  if (subscription) return "subscription-ready"

  const publicKey = await fetchVapidPublicKey()
  if (!publicKey) return "missing-vapid"

  return "service-worker-ready"
}

export async function preparePushNotifications(): Promise<PushSetupState> {
  if (!hasPushSupport()) return "unsupported"

  const permission = await window.Notification.requestPermission()
  if (permission === "denied") return "denied"
  if (permission !== "granted") return "default"

  const registration = await registerPushServiceWorker()
  if (!registration) return "unsupported"

  const existingSubscription = await registration.pushManager.getSubscription()
  if (existingSubscription) return "subscription-ready"

  const publicKey = await fetchVapidPublicKey()
  if (!publicKey) return "missing-vapid"

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64UrlToArrayBuffer(publicKey),
  })

  await subscribePushNotifications(toPushSubscriptionPayload(subscription))

  return "subscription-ready"
}

export async function disablePushNotifications(): Promise<PushSetupState> {
  if (!hasPushSupport()) return "unsupported"

  const registration = await registerPushServiceWorker()
  if (!registration) return "unsupported"

  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    const publicKey = await fetchVapidPublicKey()
    return publicKey ? "service-worker-ready" : "missing-vapid"
  }

  const endpoint = subscription.endpoint

  try {
    await subscription.unsubscribe()
  } catch {
    // Continue with backend cleanup when possible.
  }

  await unsubscribePushNotifications(endpoint)

  const publicKey = await fetchVapidPublicKey()
  return publicKey ? "service-worker-ready" : "missing-vapid"
}
