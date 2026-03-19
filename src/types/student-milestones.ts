export type StudentProjectMilestoneStatus =
  | "PENDING"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | string

export interface StudentProjectSummary {
  id: string
  title: string
  status: string
  departmentId?: string | null
}

export interface StudentProjectMilestone {
  id: string
  projectId: string
  title: string
  description?: string | null
  dueDate: string
  status: StudentProjectMilestoneStatus
  submittedAt?: string | null
  feedback?: string | null
}

export interface StudentProjectsListResult {
  items: StudentProjectSummary[]
}

export interface StudentProjectMilestonesResult {
  items: StudentProjectMilestone[]
}
