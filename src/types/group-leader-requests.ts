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
