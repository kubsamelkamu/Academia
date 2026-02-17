import { type UserRole } from "@/config/navigation"
import { type ReactElement } from "react"
import { AdvisorDashboard } from "./roles/advisor-dashboard"
import { CoordinatorDashboard } from "./roles/coordinator-dashboard"
import { DepartmentCommitteeDashboard } from "./roles/department-committee-dashboard"
import { DepartmentHeadDashboard } from "./roles/department-head-dashboard"
import { RoleFallbackDashboard } from "./roles/role-fallback-dashboard"
import { StudentDashboard } from "./roles/student-dashboard"

interface DashboardPageProps {
  role: UserRole
}

export default function DashboardPage({ role }: DashboardPageProps) {
  const roleDashboards: Record<UserRole, ReactElement> = {
    department_head: <DepartmentHeadDashboard />,
    coordinator: <CoordinatorDashboard />,
    advisor: <AdvisorDashboard />,
    student: <StudentDashboard />,
    department_committee: <DepartmentCommitteeDashboard />,
  }

  return roleDashboards[role] ?? <RoleFallbackDashboard />
}