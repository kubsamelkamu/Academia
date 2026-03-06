"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { type UserRole } from "@/config/navigation"
import { CustomizableDashboard } from "@/components/dashboard/customizable-dashboard"
import { StudentDashboard } from "@/components/dashboard/roles/student-dashboard"
import { useAuthStore } from "@/store/auth-store"
import { getDashboardRoleSlug, getPrimaryRoleFromBackendRoles } from "@/lib/auth/dashboard-role-paths"

function AdvisorDashboardWelcome(props: { userName?: string }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const hour = now.getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  const formattedDateTime = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(now)

  const name = props.userName?.trim()

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">{formattedDateTime}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Welcome{name ? `, ${name}` : ""} to Academia
        </h1>
        <p className="mt-2 text-muted-foreground">{greeting}. We’re glad you’re here.</p>
      </div>

      {/*
      Previous Advisor dashboard implementation (kept as reference for teammates):

      return (
        <CustomizableDashboard
          role={primaryRole ?? role}
          userId={user.id}
          userName={userName || undefined}
        />
      )
      */}
    </div>
  )
}

function StudentDashboardWelcome(props: { userName?: string }) {
  return <StudentDashboard userName={props.userName} />
}

function DepartmentHeadDashboardWelcome(props: { userName?: string }) {
  const [today] = useState(() => new Date())
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(today)

  const name = props.userName?.trim()

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">{formattedDate}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Welcome{name ? `, ${name}` : ""}
        </h1>
        <p className="mt-2 text-muted-foreground">Department Head</p>
      </div>
    </div>
  )
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

  return (
    <CustomizableDashboard
      role={effectiveRole}
      userId={user.id}
      userName={userName || undefined}
    />
  )
}
