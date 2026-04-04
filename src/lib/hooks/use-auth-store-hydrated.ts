"use client"

import { useEffect, useState } from "react"

import { useAuthStore } from "@/store/auth-store"

/**
 * True once the persisted auth store has finished rehydrating from storage.
 * Use this before trusting `accessToken` / `user` on first client render.
 */
export function useAuthStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      queueMicrotask(() => {
        setHydrated(true)
      })
      return
    }
    return useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true)
    })
  }, [])

  return hydrated
}
