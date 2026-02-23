"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { type UserRole } from "@/config/navigation"
import { CustomizableDashboard } from "@/components/dashboard/customizable-dashboard"
import { useAuthStore } from "@/store/auth-store"
import { getDashboardRoleSlug, getPrimaryRoleFromBackendRoles } from "@/lib/auth/dashboard-role-paths"

interface DashboardPageProps {
  role: UserRole
}

export default function DashboardPage({ role }: DashboardPageProps) {
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)

  const primaryRole = useMemo(() => getPrimaryRoleFromBackendRoles(user?.roles), [user?.roles])

  useEffect(() => {
    if (!accessToken && !isLoading) {
      router.replace("/login")
      return
    }

    if (primaryRole && primaryRole !== role) {
      router.replace(`/dashboard/${getDashboardRoleSlug(primaryRole)}`)
    }
  }, [accessToken, isLoading, primaryRole, role, router])

  if (!accessToken) {
    return null
  }

  if (!user) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        Loading...
      </div>
    )
  }

  const userName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()

  return (
    <CustomizableDashboard
      role={primaryRole ?? role}
      userId={user.id}
      userName={userName || undefined}
    />
  )
}
