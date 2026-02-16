import { CoordinatorDashboardData, DepartmentHeadDashboardData } from "@/types/dashboard"

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

const mockCoordinatorDashboardData: CoordinatorDashboardData = {
  kpis: [
    {
      title: "Active Projects",
      value: "96",
      note: "Within your department",
      icon: "folderKanban",
    },
    {
      title: "Assigned Students",
      value: "214",
      note: "Current cycle",
      icon: "graduationCap",
    },
    {
      title: "Scheduled Defenses",
      value: "18",
      note: "Next 30 days",
      icon: "calendar",
    },
    {
      title: "Pending Evaluations",
      value: "27",
      note: "Awaiting committee action",
      icon: "clipboardList",
    },
  ],
  pendingQueue: [
    {
      title: "Advisor assignment update",
      detail: "6 projects need advisor reassignment review",
      priority: "High",
    },
    {
      title: "Defense slot conflict",
      detail: "Two teams overlap on Wednesday 11:00 AM",
      priority: "High",
    },
    {
      title: "Evaluation follow-up",
      detail: "4 pending evaluations near deadline",
      priority: "Medium",
    },
  ],
  upcomingDefenses: [
    {
      team: "Team Atlas",
      date: "Feb 20 • 10:00 AM",
      room: "Room A-301",
    },
    {
      team: "Team Nova",
      date: "Feb 21 • 12:30 PM",
      room: "Room B-204",
    },
    {
      team: "Team Sigma",
      date: "Feb 22 • 09:00 AM",
      room: "Room A-205",
    },
  ],
}

export async function getDepartmentHeadDashboardData(): Promise<DepartmentHeadDashboardData> {
  await new Promise((resolve) => {
    setTimeout(resolve, 500)
  })

  return mockDepartmentHeadDashboardData
}

export async function getCoordinatorDashboardData(): Promise<CoordinatorDashboardData> {
  await new Promise((resolve) => {
    setTimeout(resolve, 500)
  })

  return mockCoordinatorDashboardData
}
