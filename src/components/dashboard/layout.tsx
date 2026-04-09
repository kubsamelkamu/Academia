"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { ThemeCustomizer } from "@/components/providers/theme-customizer"
import { useAuthStore } from "@/store/auth-store"
import { getPrimaryRoleFromBackendRoles } from "@/lib/auth/dashboard-role-paths"
import { useNotificationsUnreadCount } from "@/lib/hooks/use-notifications"
import { TenantEnforcementNotice } from "@/components/notifications/tenant-enforcement-notice"
import { NotificationsRealtime } from "@/components/notifications/notifications-realtime"
import { ProjectGroupAnnouncementsRealtime } from "@/components/realtime/project-group-announcements-realtime"
import { DepartmentAnnouncementsRealtime } from "@/components/realtime/department-announcements-realtime"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)

  const primaryRole = useMemo(() => getPrimaryRoleFromBackendRoles(user?.roles), [user?.roles])
  const shouldFetchMeRef = useRef(false)
  const [authHydrated, setAuthHydrated] = useState(false)

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      queueMicrotask(() => {
        setAuthHydrated(true)
      })
      return
    }
    return useAuthStore.persist.onFinishHydration(() => {
      setAuthHydrated(true)
    })
  }, [])

  const { data: unreadCount } = useNotificationsUnreadCount({
    enabled: Boolean(accessToken),
    refetchOnWindowFocus: true,
    staleTime: 0,
    refetchInterval: 60_000,
  })

  useEffect(() => {
    if (!authHydrated) return
    if (!accessToken && !isLoading) {
      router.replace("/login")
    }
  }, [authHydrated, accessToken, isLoading, router])

  useEffect(() => {
    if (!accessToken || !user) {
      return
    }

    if (user.mustChangePassword && pathname !== "/change-password") {
      router.replace("/change-password")
      return
    }

    const tenantStatus = user.tenant?.status
    if (tenantStatus && tenantStatus !== "ACTIVE") {
      router.replace("/account-suspended")
      // Avoid leaving a stale authenticated shell around.
      setTimeout(() => {
        useAuthStore.getState().clearAuthSession()
      }, 0)
      return
    }

    // If we have an authenticated user but haven't loaded /auth/me data that includes
    // tenant verification status yet, fetch it once (important on older persisted sessions).
    if (primaryRole === "department_head" && user.tenantVerification === undefined && !shouldFetchMeRef.current) {
      shouldFetchMeRef.current = true
      void useAuthStore.getState().fetchMe().catch(() => {
        // ignore; axios interceptor handles 401
      })
    }
  }, [accessToken, pathname, primaryRole, router, user])

  const shellUser = useMemo(() => {
    const role = primaryRole ?? "student"
    const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "User"

    return {
      id: user?.id ?? "unknown",
      name,
      email: user?.email ?? "",
      role,
      avatar: user?.avatarUrl ?? undefined,
    }
  }, [primaryRole, user])

  if (!authHydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!accessToken) {
    return null
  }

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        Loading...
      </div>
    )
  }

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 w-full overflow-hidden bg-background">
      <NotificationsRealtime />
      <ProjectGroupAnnouncementsRealtime />
      <DepartmentAnnouncementsRealtime />
      <ThemeCustomizer />
      <aside
        className="hidden h-dvh max-h-dvh min-h-0 shrink-0 overflow-hidden lg:flex lg:flex-col"
        aria-label="Main navigation"
      >
        <Sidebar user={shellUser} />
      </aside>
      <MobileSidebar user={shellUser} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardHeader user={shellUser} notificationCount={unreadCount?.count ?? 0} />
        <main
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain bg-muted/10",
            pathname.startsWith("/dashboard/advisor/evaluator")
              ? "p-0"
              : pathname.startsWith("/dashboard/student")
                ? "px-3 py-4 sm:px-6 sm:py-6"
                : "p-4 sm:p-6",
          )}
        >
          <div
            className={cn(
              pathname.startsWith("/dashboard/advisor/evaluator") && "px-4 pt-4 sm:px-6 sm:pt-5",
            )}
          >
            <TenantEnforcementNotice role={shellUser.role} isAuthenticated={Boolean(accessToken)} />
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}