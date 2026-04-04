"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { ThemeProvider } from "next-themes"
import { useEffect, useRef, useState } from "react"
import { useAuthStore } from "@/store/auth-store"
import { Toaster } from "@/components/ui/sonner"
import { ThemeRouteSync } from "@/components/providers/theme-route-sync"

export function Providers({ children }: { children: React.ReactNode }) {
  const removeChildGuardPatchedRef = useRef(false)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  useEffect(() => {
    if (removeChildGuardPatchedRef.current) return
    removeChildGuardPatchedRef.current = true

    const nativeRemoveChild = Node.prototype.removeChild
    Node.prototype.removeChild = function patchedRemoveChild<T extends Node>(child: T): T {
      if (!child || child.parentNode !== this) {
        // Prevent runtime crashes from stale portal teardown order
        // in React 19 + Turbopack + Radix combinations.
        return child
      }
      return nativeRemoveChild.call(this, child) as T
    }

    // Run after zustand persist rehydrates so accessToken/user from storage exist (v3+).
    const runBootstrap = () => void useAuthStore.getState().bootstrap()
    const unsubHydration = useAuthStore.persist.onFinishHydration(() => {
      runBootstrap()
    })
    if (useAuthStore.persist.hasHydrated()) {
      runBootstrap()
    }

    return () => {
      unsubHydration()
      Node.prototype.removeChild = nativeRemoveChild
      removeChildGuardPatchedRef.current = false
    }
  }, [])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      storageKey="academia-theme-mode"
    >
      <QueryClientProvider client={queryClient}>
        <ThemeRouteSync />
        {children}
        <Toaster />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
