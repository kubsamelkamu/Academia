"use client"

import { io, type Socket } from "socket.io-client"

export type NotificationsSocketAuth = {
  accessToken: string
  tenantDomain?: string
}

function deriveSocketOrigin(apiBaseUrl: string | undefined): string {
  if (apiBaseUrl) {
    try {
      return new URL(apiBaseUrl).origin
    } catch {
      // ignore and fall back
    }
  }

  if (typeof window !== "undefined") {
    return window.location.origin
  }

  return ""
}

type SocketKey = string

let sharedSocket: Socket | null = null
let sharedSocketKey: SocketKey | null = null
let sharedSocketRefs = 0

function buildKey(auth: NotificationsSocketAuth): SocketKey {
  return `${auth.accessToken}::${auth.tenantDomain ?? ""}`
}

export function acquireNotificationsSocket(auth: NotificationsSocketAuth): Socket {
  const origin = deriveSocketOrigin(process.env.NEXT_PUBLIC_API_BASE_URL)
  if (!origin) {
    throw new Error("Socket origin could not be derived")
  }

  const key = buildKey(auth)

  // If the auth context changed, start a fresh socket.
  if (sharedSocket && sharedSocketKey && sharedSocketKey !== key) {
    sharedSocket.disconnect()
    sharedSocket = null
    sharedSocketKey = null
    sharedSocketRefs = 0
  }

  if (!sharedSocket) {
    sharedSocket = io(`${origin}/notifications`, {
      transports: ["websocket"],
      auth: {
        token: auth.accessToken,
        tenantDomain: auth.tenantDomain,
      },
    })
    sharedSocketKey = key
    sharedSocketRefs = 0
  }

  sharedSocketRefs += 1
  return sharedSocket
}

export function releaseNotificationsSocket(socket: Socket): void {
  if (!sharedSocket || socket !== sharedSocket) {
    return
  }

  sharedSocketRefs = Math.max(0, sharedSocketRefs - 1)
  if (sharedSocketRefs === 0) {
    sharedSocket.disconnect()
    sharedSocket = null
    sharedSocketKey = null
  }
}
