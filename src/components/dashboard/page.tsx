"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { type UserRole } from "@/config/navigation"
import { CustomizableDashboard } from "@/components/dashboard/customizable-dashboard"
import { StudentDashboard } from "@/components/dashboard/roles/student-dashboard"
import { DepartmentHeadDashboard } from "@/components/dashboard/roles/department-head-dashboard"
import { AdvisorDashboard } from "@/components/dashboard/roles/advisor-dashboard"
import { EvaluatorDashboard } from "@/components/dashboard/roles/evaluator-dashboard"
import { useAuthStore } from "@/store/auth-store"
import { getDashboardRoleSlug, getPrimaryRoleFromBackendRoles } from "@/lib/auth/dashboard-role-paths"

function AdvisorDashboardWelcome(props: { userName?: string }) {
  return <AdvisorDashboard userName={props.userName} />
}

function StudentDashboardWelcome(props: { userName?: string }) {
  return <StudentDashboard userName={props.userName} />
}

function DepartmentHeadDashboardWelcome(props: { userName?: string }) {
  // For department heads, show the full analytics dashboard experience.
  // We ignore the userName for now because the dedicated dashboard
  // already includes its own contextual header and copy.
  void props
  return <DepartmentHeadDashboard />
}

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

  const effectiveRole = primaryRole ?? role

  if (effectiveRole === "advisor") {
    return <AdvisorDashboardWelcome userName={userName || undefined} />
  }

  if (effectiveRole === "student") {
    return <StudentDashboardWelcome userName={userName || undefined} />
  }

  if (effectiveRole === "department_head") {
    return <DepartmentHeadDashboardWelcome userName={userName || undefined} />
  }

  if (effectiveRole === "evaluator") {
    return <EvaluatorDashboard />
  }

  return (
    <CustomizableDashboard
      role={effectiveRole}
      userId={user.id}
      userName={userName || undefined}
    />
  )
}