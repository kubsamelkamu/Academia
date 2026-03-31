"use client"

import { Suspense, useEffect, useMemo } from "react"
import { SettingsPageClient } from "@/components/dashboard/settings/settings-page-client"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import { getPrimaryRoleFromBackendRoles } from "@/lib/auth/dashboard-role-paths"

export default function SettingsPage() {
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)

  const primaryRole = useMemo(() => getPrimaryRoleFromBackendRoles(user?.roles), [user?.roles])

  useEffect(() => {
    if (!accessToken && !isLoading) {
      router.replace("/login")
    }
  }, [accessToken, isLoading, router])

  if (!accessToken || !user) {
    return <></>
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Loading settings…
        </div>
      }
    >
      <SettingsPageClient role={primaryRole ?? "student"} />
    </Suspense>
  )
}
