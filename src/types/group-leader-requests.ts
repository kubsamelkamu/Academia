export type GroupLeaderRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | string

export interface CreateGroupLeaderRequestDto {
  reason: string
}

export interface GroupLeaderRequestResponse {
  id: string
  status: GroupLeaderRequestStatus

  // Present on create request response
  createdAt?: string
  message?: string | null

  // Present on approve/reject review responses
  tenantId?: string
  departmentId?: string
  studentUserId?: string
  reviewedByUserId?: string
  reviewedAt?: string | null
  rejectionReason?: string | null
  updatedAt?: string
}

export type GroupLeaderMeNoRequest = {
  status: null
}

export type GroupLeaderMeRequest = {
  status: Exclude<GroupLeaderRequestStatus, null>
  message: string | null
  reviewedAt: string | null
  rejectionReason: string | null
  createdAt: string
}

export type GroupLeaderMeResponse = GroupLeaderMeNoRequest | GroupLeaderMeRequest

// List API types for pending/approved requests
export interface GroupLeaderRequestItem {
  id: string
  status: GroupLeaderRequestStatus
  createdAt: string // ISO date
  updatedAt: string // ISO date

  reviewedAt: string | null
  rejectionReason: string | null
  message: string | null

  student: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatarUrl: string | null
    tenantId: string
    departmentId: string
    profile: {
      bio: string | null
      githubUrl: string | null
      linkedinUrl: string | null
      portfolioUrl: string | null
      techStack: string[]
      updatedAt: string | null
    } | null
  }
}

export interface GroupLeaderRequestsPagination {
  total: number
  page: number
  limit: number
  pages: number
}

export interface GroupLeaderRequestsSummary {
  total: number
  pending: number
  approved: number
  rejected: number
}

export interface GroupLeaderRequestsListData {
  summary?: GroupLeaderRequestsSummary
  items: GroupLeaderRequestItem[]
  pagination: GroupLeaderRequestsPagination
}

export interface GroupLeaderRequestsListResponse {
  success: boolean
  message: string
  data: GroupLeaderRequestsListData
  timestamp: string
}
