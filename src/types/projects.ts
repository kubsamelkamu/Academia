import type { StudentProjectMilestoneStatus } from "@/types/student-milestones"

export type ProjectAdvisor = {
  id: string
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  avatarUrl?: string | null
}

export type ProjectStudentProfile = {
  id: string
  bio?: string | null
  githubUrl?: string | null
  linkedinUrl?: string | null
  portfolioUrl?: string | null
  techStack?: string[] | null
}

export type ProjectMember = {
  id: string
  projectId?: string | null
  userId?: string | null
  role?: string | null
  joinedAt?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  avatarUrl?: string | null
  student?: ProjectStudentProfile | null
  user?: {
    id: string
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    avatarUrl?: string | null
    student?: ProjectStudentProfile | null
  } | null
}

export type ProjectGroupMember = {
  user: {
    id: string
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    avatarUrl?: string | null
    student?: ProjectStudentProfile | null
  }
  joinedAt?: string | null
}

export type ProjectGroupDetail = {
  id: string
  name: string
  objectives?: string | null
  technologies?: string[] | null
  status?: string | null
  submittedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  leader?: {
    id: string
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    avatarUrl?: string | null
    student?: ProjectStudentProfile | null
  } | null
  members?: ProjectGroupMember[] | null
}

export type ProjectProposal = {
  id: string
  title: string
  description?: string | null
  projectGroup?: ProjectGroupDetail | null
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
  tenantId?: string | null
  departmentId?: string | null
  title: string
  status: string
  description?: string | null
  proposalId?: string | null
  advisorId?: string | null
  milestoneTemplateId?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  proposal?: ProjectProposal | null
  advisor?: ProjectAdvisor | null
  members?: ProjectMember[] | null
  milestones?: ProjectDetailMilestone[] | null
  department?: {
    id: string
    name: string
  } | null
}

export type DepartmentOverviewProjectGroup = {
  id: string
  name: string
}

export type DepartmentOverviewProjectAdvisor = {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl?: string | null
}

export type DepartmentOverviewProject = {
  id: string
  projectName: string
  status: string
  group: DepartmentOverviewProjectGroup
  advisor: DepartmentOverviewProjectAdvisor
  milestoneProgressPercent: number
  milestonesCompleted: number
  milestonesTotal: number
}

export type DepartmentProjectsOverview = {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  cancelledProjects: number
  completionRate: number
  totalStudents: number
  activeAdvisors: number
  avgProjectDuration: number
  proposalsThisMonth: number
  milestonesDueThisWeek: number
  projects: DepartmentOverviewProject[]
}
