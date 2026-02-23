"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { getDashboardRoleSlug, getPrimaryRoleFromBackendRoles } from "@/lib/auth/dashboard-role-paths"
import { useAuthStore } from "@/store/auth-store"
import { type UserRole } from "@/config/navigation"

function resolveDefensePathByRole(role: UserRole): string {
  const slug = getDashboardRoleSlug(role)

  if (role === "student") {
    return `/dashboard/${slug}/defense`
  }

  if (role === "coordinator") {
    return `/dashboard/${slug}/defenses`
  }

  if (role === "department_committee") {
    return `/dashboard/${slug}/defense-schedule`
  }

  return `/dashboard/${slug}`
}

export default function DefenseFallbackPage() {
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

    if (accessToken && user) {
      router.replace(resolveDefensePathByRole(primaryRole ?? "student"))
    }
  }, [accessToken, isLoading, primaryRole, router, user])

  return null
}
