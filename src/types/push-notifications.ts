export type PushVapidPublicKeyResponse = {
  publicKey: string | null
}

export type PushSubscriptionKeys = {
  p256dh?: string
  auth?: string
}

export type PushSubscriptionPayload = {
  endpoint?: string
  expirationTime?: number | null
  keys?: PushSubscriptionKeys
}
