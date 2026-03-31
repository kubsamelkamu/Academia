import type { StudentProjectMilestoneStatus } from "@/types/student-milestones"

export type ProjectAdvisor = {
  id: string
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  avatarUrl?: string | null
}

export type ProjectMember = {
  id: string
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  avatarUrl?: string | null
}

export type ProjectDetailMilestone = {
  id: string
  projectId?: string
  title: string
  description?: string | null
  dueDate: string
  status: StudentProjectMilestoneStatus
  submittedAt?: string | null
  feedback?: string | null
}

export type ProjectDetail = {
  id: string
  title: string
  status: string
  description?: string | null
  createdAt?: string | null
  advisor?: ProjectAdvisor | null
  members?: ProjectMember[] | null
  milestones?: ProjectDetailMilestone[] | null
}
