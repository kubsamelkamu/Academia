"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import { getDashboardRoleSlug, getPrimaryRoleFromBackendRoles } from "@/lib/auth/dashboard-role-paths"

export default function Page() {
  
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
      router.replace(`/dashboard/${getDashboardRoleSlug(primaryRole ?? "student")}`)
    }
  }, [accessToken, isLoading, primaryRole, router, user])

  return null
}