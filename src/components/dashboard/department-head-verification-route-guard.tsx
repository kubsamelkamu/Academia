"use client"

import { useEffect, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import { getPrimaryRoleFromBackendRoles } from "@/lib/auth/dashboard-role-paths"

/**
 * Forces department heads who must submit verification to the Settings → Verification tab.
 * Uses `useSearchParams`; parent should wrap in `<Suspense>`.
 */
export function DepartmentHeadVerificationRouteGuard() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const primaryRole = useMemo(() => getPrimaryRoleFromBackendRoles(user?.roles), [user?.roles])

  useEffect(() => {
    if (!accessToken || !user) {
      return
    }
    if (primaryRole !== "department_head") {
      return
    }
    if (user.tenantVerification === undefined) {
      return
    }

    const status = user.tenantVerification?.status ?? null
    const requiresUpload = status === null || status === "REJECTED"
    const tab = searchParams.get("tab")
    const onVerificationSurface =
      pathname === "/dashboard/verify-institution" ||
      (pathname === "/dashboard/settings" && tab === "verification")

    if (requiresUpload && !onVerificationSurface) {
      router.replace("/dashboard/settings?tab=verification")
    }
  }, [accessToken, pathname, primaryRole, router, searchParams, user])

  return null
}
