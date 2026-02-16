import { DepartmentHeadDashboardData } from "@/types/dashboard"

const mockDepartmentHeadDashboardData: DepartmentHeadDashboardData = {
  kpis: [
    {
      title: "Departments",
      value: "6",
      note: "Across engineering school",
      icon: "building2",
    },
    {
      title: "Coordinators",
      value: "18",
      note: "3 pending assignment",
      icon: "users",
    },
    {
      title: "Active Faculty",
      value: "84",
      note: "12 at high supervision load",
      icon: "checkCircle2",
    },
    {
      title: "Projects at Risk",
      value: "11",
      note: "Require intervention this week",
      icon: "shieldAlert",
    },
  ],
  urgentApprovals: [
    {
      title: "Coordinator assignment request",
      detail: "Computer Science • 2 candidates awaiting approval",
      priority: "High",
    },
    {
      title: "Defense panel conflict",
      detail: "Software Engineering • Schedule overlap on Thursday",
      priority: "High",
    },
    {
      title: "Faculty workload exception",
      detail: "Information Systems • Exceeds advisory cap",
      priority: "Medium",
    },
  ],
  coordinatorStatus: [
    { name: "Engineering", active: 4, blocked: 1 },
    { name: "Computer Science", active: 5, blocked: 0 },
    { name: "Information Systems", active: 3, blocked: 1 },
  ],
  upcomingDefenses: [],
}

export async function getDepartmentHeadDashboardData(): Promise<DepartmentHeadDashboardData> {
  await new Promise((resolve) => {
    setTimeout(resolve, 500)
  })

  return mockDepartmentHeadDashboardData
}
