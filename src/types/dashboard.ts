export interface DepartmentHeadKpi {
  title: string
  value: string
  note: string
  icon: "building2" | "users" | "checkCircle2" | "shieldAlert"
}

export interface DepartmentHeadApproval {
  title: string
  detail: string
  priority: "High" | "Medium" | "Low"
}

export interface DepartmentHeadCoordinatorStatus {
  name: string
  active: number
  blocked: number
}

export interface DepartmentHeadDefense {
  title: string
  date: string
  committee: string
}

export interface DepartmentHeadDashboardData {
  kpis: DepartmentHeadKpi[]
  urgentApprovals: DepartmentHeadApproval[]
  coordinatorStatus: DepartmentHeadCoordinatorStatus[]
  upcomingDefenses: DepartmentHeadDefense[]
}
