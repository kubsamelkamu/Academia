"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { useAuthStore } from "@/store/auth-store"
import { getPrimaryRoleFromBackendRoles } from "@/lib/auth/dashboard-role-paths"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    if (!accessToken && !isLoading) {
      router.replace("/login")
    }
  }, [accessToken, isLoading, router])

  const shellUser = useMemo(() => {
    const role = getPrimaryRoleFromBackendRoles(user?.roles) ?? "student"
    const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "User"

    return {
      id: user?.id ?? "unknown",
      name,
      email: user?.email ?? "",
      role,
      avatar: user?.avatarUrl ?? undefined,
    }
  }, [user])

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
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block">
        <Sidebar user={shellUser} />
      </aside>

      {/* Mobile Sidebar */}
      <MobileSidebar user={shellUser} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader user={shellUser} notificationCount={3} />
        <main className="flex-1 overflow-y-auto bg-muted/10 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}