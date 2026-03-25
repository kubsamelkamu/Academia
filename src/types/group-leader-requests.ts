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
  createdAt: string
  message: string | null
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
  userId: string
  firstName: string
  lastName: string
  email: string
  departmentId: string
  departmentName: string
  status: GroupLeaderRequestStatus
  createdAt: string // ISO date
  updatedAt: string // ISO date
}

export interface GroupLeaderRequestsPagination {
  total: number
  page: number
  limit: number
  pages: number
}

export interface GroupLeaderRequestsListData {
  items: GroupLeaderRequestItem[]
  pagination: GroupLeaderRequestsPagination
}

export interface GroupLeaderRequestsListResponse {
  success: boolean
  message: string
  data: GroupLeaderRequestsListData
  timestamp: string
}
