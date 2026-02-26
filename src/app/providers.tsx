"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { ThemeProvider } from "next-themes"
import { useEffect, useState } from "react"
import { useAuthStore } from "@/store/auth-store"
import { Toaster } from "@/components/ui/sonner"
import { ThemeRouteSync } from "@/components/providers/theme-route-sync"

export function Providers({ children }: { children: React.ReactNode }) {
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
    // Hydrate user session from stored token (client-side only).
    void useAuthStore.getState().bootstrap()
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
