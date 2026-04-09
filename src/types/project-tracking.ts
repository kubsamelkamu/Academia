export type CoordinatorProjectTrackingStatus = "ACTIVE" | "COMPLETED" | "CANCELLED" | string

export type CoordinatorProjectMilestoneStatus =
  | "APPROVED"
  | "SUBMITTED"
  | "REJECTED"
  | "PENDING"
  | string

export interface CoordinatorProjectTrackingParams {
  departmentId: string
  search?: string
  projectStatus?: string
  page?: number
  limit?: number
}

export interface CoordinatorProjectTrackingSummary {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  cancelledProjects: number
}

export interface CoordinatorProjectTrackingPagination {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface CoordinatorProjectTrackingPerson {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  avatarUrl: string | null
}

export interface CoordinatorProjectTrackingStudentProfile {
  id: string
  bio: string | null
  githubUrl: string | null
  linkedinUrl: string | null
  portfolioUrl: string | null
  techStack: string[]
}

export interface CoordinatorProjectTrackingGroupMember extends CoordinatorProjectTrackingPerson {
  status: string
  joinedAt: string
  studentProfile: CoordinatorProjectTrackingStudentProfile | null
}

export interface CoordinatorProjectTrackingGroupLeader extends CoordinatorProjectTrackingPerson {
  status: string
  studentProfile: CoordinatorProjectTrackingStudentProfile | null
}

export interface CoordinatorProjectTrackingApprovedFile {
  submissionId: string
  fileName: string
  mimeType: string
  sizeBytes: number
  fileUrl: string
  filePublicId: string
  resourceType: string
  approvedAt: string
  approvedBy: CoordinatorProjectTrackingPerson | null
}

export interface CoordinatorProjectTrackingMilestone {
  id: string
  title: string
  description: string | null
  status: CoordinatorProjectMilestoneStatus
  dueDate: string
  submittedAt: string | null
  feedback: string | null
  createdAt: string
  updatedAt: string
  approvedSubmissionFile: CoordinatorProjectTrackingApprovedFile | null
}

export interface CoordinatorProjectTrackingItem {
  projectId: string
  projectTitle: string
  projectDescription: string | null
  projectStatus: CoordinatorProjectTrackingStatus
  createdAt: string
  updatedAt: string
  proposal: {
    id: string
    title: string
  } | null
  advisor: CoordinatorProjectTrackingPerson | null
  group: {
    id: string
    name: string
    status: string
    objectives: string | null
    technologies: string[]
    leader: CoordinatorProjectTrackingGroupLeader | null
    members: CoordinatorProjectTrackingGroupMember[]
    totalMembers: number
  } | null
  milestoneProgress: {
    percentage: number
    approved: number
    submitted: number
    rejected: number
    pending: number
    total: number
  }
  milestones: CoordinatorProjectTrackingMilestone[]
}

export interface CoordinatorProjectTrackingResponse {
  departmentId: string
  generatedAt: string
  summary: CoordinatorProjectTrackingSummary
  pagination: CoordinatorProjectTrackingPagination
  filters: {
    search: string | null
    projectStatus: string | null
  }
  items: CoordinatorProjectTrackingItem[]
}