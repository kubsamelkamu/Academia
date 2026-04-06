export type AdvisorAnalyticsProjectStatus = "ACTIVE" | "COMPLETED" | "CANCELLED"

export type AdvisorAnalyticsMilestoneStatus =
  | "APPROVED"
  | "SUBMITTED"
  | "REJECTED"
  | "PENDING"
  | string

export interface CoordinatorAdvisorOverviewParams {
  departmentId: string
  page?: number
  limit?: number
  search?: string
  projectStatus?: AdvisorAnalyticsProjectStatus
  startDate?: string
  endDate?: string
}

export interface CoordinatorAdvisorOverviewMilestone {
  id: string
  title: string
  description: string | null
  status: AdvisorAnalyticsMilestoneStatus
  dueDate: string
  submittedAt: string | null
  feedback: string | null
  createdAt: string
  updatedAt: string
}

export interface CoordinatorAdvisorOverviewProject {
  id: string
  title: string
  description: string | null
  status: AdvisorAnalyticsProjectStatus | string
  createdAt: string
  updatedAt: string
  advisor: {
    id: string
    firstName: string
    lastName: string
    fullName: string
    email: string
    avatarUrl: string | null
  }
  proposal: {
    id: string
    title: string
  } | null
  progress: {
    percentage: number
    approvedMilestones: number
    submittedMilestones: number
    rejectedMilestones: number
    pendingMilestones: number
    totalMilestones: number
  }
  milestones: CoordinatorAdvisorOverviewMilestone[]
  group: {
    id: string
    name: string
    status: string
    objectives: string | null
    technologies: string[]
    leader: {
      id: string
      firstName: string
      lastName: string
      fullName: string
      email: string
      avatarUrl: string | null
      studentProfile: unknown | null
    } | null
    members: Array<{
      id: string
      firstName: string
      lastName: string
      fullName: string
      email: string
      avatarUrl: string | null
      studentProfile: unknown | null
    }>
    totalMembers: number
  }
}

export interface CoordinatorAdvisorOverviewAdvisor {
  advisorProfileId: string
  advisorId: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  avatarUrl: string | null
  status: string
  loadLimit: number
  currentLoad: number
  availableCapacity: number
  metrics: {
    totalProjectsAdvising: number
    activeProjectsCount: number
    completedProjectsCount: number
    cancelledProjectsCount: number
    overallProjectProgress: number
  }
  projects: CoordinatorAdvisorOverviewProject[]
}

export interface CoordinatorAdvisorOverviewResponse {
  departmentId: string
  generatedAt: string
  summary: {
    totalAdvisors: number
    totalProjects: number
    assignedProjects: number
    unassignedProjects: number
    overallDepartmentProjectProgress: number
    projectStatusCounts: {
      ACTIVE: number
      COMPLETED: number
      CANCELLED: number
    }
  }
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  filters: {
    search: string | null
    projectStatus: string | null
    startDate: string | null
    endDate: string | null
  }
  advisors: CoordinatorAdvisorOverviewAdvisor[]
}