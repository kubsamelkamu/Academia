"use client"

import { useEffect, useMemo, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { ThemeCustomizer } from "@/components/providers/theme-customizer"
import { useAuthStore } from "@/store/auth-store"
import { getPrimaryRoleFromBackendRoles } from "@/lib/auth/dashboard-role-paths"
import { useNotificationsUnreadCount } from "@/lib/hooks/use-notifications"
import { TenantEnforcementNotice } from "@/components/notifications/tenant-enforcement-notice"

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

  const { data: unreadCount } = useNotificationsUnreadCount({
    enabled: Boolean(accessToken),
    refetchOnWindowFocus: true,
    staleTime: 0,
    refetchInterval: 60_000,
  })

  useEffect(() => {
    if (!accessToken && !isLoading) {
      router.replace("/login")
    }
  }, [accessToken, isLoading, router])

  useEffect(() => {
    if (!accessToken || !user) {
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
  }, [accessToken, primaryRole, router, user])

  useEffect(() => {
    if (!accessToken || !user) {
      return
    }

    if (primaryRole !== "department_head") {
      return
    }

    // Unknown state (not fetched yet) -> don't redirect.
    if (user.tenantVerification === undefined) {
      return
    }

    const status = user.tenantVerification?.status ?? null
    const requiresUpload = status === null || status === "REJECTED"
    const isOnVerificationPage = pathname === "/dashboard/verify-institution"

    if (requiresUpload && !isOnVerificationPage) {
      router.replace("/dashboard/verify-institution")
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

  if (!accessToken) {
    return null
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <ThemeCustomizer />
      <aside className="hidden lg:block">
        <Sidebar user={shellUser} />
      </aside>
      <MobileSidebar user={shellUser} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader user={shellUser} notificationCount={unreadCount?.count ?? 0} />
        <main className="flex-1 overflow-y-auto bg-muted/10 p-6">
          <TenantEnforcementNotice role={shellUser.role} isAuthenticated={Boolean(accessToken)} />
          {children}
        </main>
      </div>
    </div>
  )
}