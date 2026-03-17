export interface CreateProjectGroupDto {
  name: string
  objectives: string
  technologies: string[]
}

export interface ProjectGroup {
  id: string
  tenantId?: string
  departmentId?: string
  leaderUserId?: string
  name: string
  objectives: string
  technologies: string[]
  createdAt?: string
  updatedAt?: string
}

export interface ProjectGroupLeader {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
}

export interface ProjectGroupMemberUser {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
}

export interface ProjectGroupMember {
  id: string
  joinedAt: string
  user: ProjectGroupMemberUser
}

export interface ProjectGroupMe {
  id: string
  tenantId: string
  departmentId: string
  leaderUserId: string
  name: string
  objectives: string
  technologies: string[]
  status?: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | string
  submittedAt?: string | null
  reviewedAt?: string | null
  reviewedByUserId?: string | null
  rejectionReason?: string | null
  createdAt: string
  updatedAt: string
  leader: ProjectGroupLeader
  reviewedBy?: ProjectGroupLeader | null
  members: ProjectGroupMember[]
  pendingInvitationsCount: number
}

export type AvailableStudentProfile = {
  bio: string | null
  githubUrl: string | null
  linkedinUrl: string | null
  portfolioUrl: string | null
  techStack: string[]
}

export type AvailableStudentUser = {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  departmentId: string | null
}

export type AvailableStudentListItem = {
  user: AvailableStudentUser
  profile: AvailableStudentProfile
}

export type AvailableStudentsPagination = {
  total: number
  page: number
  limit: number
  pages: number
}

export type AvailableStudentsPage = {
  items: AvailableStudentListItem[]
  pagination: AvailableStudentsPagination
}

export type CreateProjectGroupInvitationDto = {
  invitedUserId: string
}

export type ProjectGroupInvitationPreviewResult = {
  subject: string
  htmlContent: string
  textContent: string
  templateParams: Record<string, unknown>
  acceptUrl: string
  rejectUrl: string
  expiresAt: string
  templateId: number | null
}

export type ProjectGroupInvitation = {
  id: string
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | string
  expiresAt: string
}

export type CreateProjectGroupInvitationResult = {
  invitation: ProjectGroupInvitation
  /** Some backends return an informational message like "Invitation already sent". */
  message?: string
}

export type BrowseProjectGroupLeader = {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
}

export type BrowseProjectGroupItem = {
  id: string
  name: string
  objectives: string
  technologies: string[]
  status: string
  leader: BrowseProjectGroupLeader
  memberCount: number
  maxGroupSize: number
  isFull: boolean
  isFormed: boolean
  isJoinable: boolean
  createdAt: string
  updatedAt: string
}

export type BrowseProjectGroupsPagination = {
  total: number
  page: number
  limit: number
  pages: number
}

export type BrowseProjectGroupsPage = {
  items: BrowseProjectGroupItem[]
  pagination: BrowseProjectGroupsPagination
}

export type ProjectGroupDetailsLeader = {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
}

export type ProjectGroupDetailsMember = {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
  joinedAt: string
}

export type ProjectGroupDetails = {
  id: string
  tenantId: string
  departmentId: string
  name: string
  objectives: string | null
  technologies: string[]
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | string
  createdAt: string
  updatedAt: string
  leader: ProjectGroupDetailsLeader
  members: ProjectGroupDetailsMember[]
  memberCount: number
  maxGroupSize: number
  isFull: boolean
  isFormed: boolean
  isJoinable: boolean
}

export type CreateProjectGroupJoinRequestDto = {
  /** Optional message from the student; will be trimmed by the backend (max length 1000). */
  message?: string
}

export type ProjectGroupJoinRequest = {
  id: string
  status: "PENDING" | string
  createdAt: string
}

export type CreateProjectGroupJoinRequestResult = {
  request: ProjectGroupJoinRequest
  /** Some backends return an informational message like "Join request already sent". */
  message?: string
}

export type CancelProjectGroupJoinRequestResult = {
  request: {
    id: string
    status: "CANCELLED" | string
    decidedAt: string
  }
}

export type MyProjectGroupJoinRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "REVOKED"
  | "CANCELLED"

export type MyProjectGroupJoinRequestLeader = {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
}

export type MyProjectGroupJoinRequestGroup = {
  id: string
  name: string
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | string
  leader: MyProjectGroupJoinRequestLeader
}

export type MyProjectGroupJoinRequestItem = {
  id: string
  status: MyProjectGroupJoinRequestStatus | string
  message: string | null
  createdAt: string
  decidedAt: string | null
  rejectionReason: string | null
  group: MyProjectGroupJoinRequestGroup
}

export type MyProjectGroupJoinRequestsPagination = {
  total: number
  page: number
  limit: number
  pages: number
}

export type MyProjectGroupJoinRequestsPage = {
  items: MyProjectGroupJoinRequestItem[]
  pagination: MyProjectGroupJoinRequestsPagination
}

export type MyGroupJoinRequestStudent = {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  avatarUrl: string | null
  departmentName?: string | null
}

export type MyGroupJoinRequestItem = {
  id: string
  status: MyProjectGroupJoinRequestStatus | string
  message: string | null
  createdAt: string
  decidedAt: string | null
  rejectionReason?: string | null
  student: MyGroupJoinRequestStudent | null
}

export type MyGroupJoinRequestsPagination = {
  total: number
  page: number
  limit: number
  pages: number
}

export type MyGroupJoinRequestsPage = {
  items: MyGroupJoinRequestItem[]
  pagination: MyGroupJoinRequestsPagination
}

export type ApproveMyGroupJoinRequestResult = {
  approved: boolean
  requestId: string
  memberAdded: boolean
}

export type RejectMyGroupJoinRequestDto = {
  /** Optional reason; will be trimmed by the backend (max length 500). */
  reason?: string
}

export type RejectMyGroupJoinRequestResult = {
  request: {
    id: string
    status: "REJECTED" | string
    decidedAt: string
    rejectionReason: string | null
  }
}

export type SubmitMyProjectGroupResult = {
  group: {
    id: string
    status: "SUBMITTED" | string
    submittedAt: string
  }
  revokedInvitationsCount?: number
  revokedJoinRequestsCount?: number
}

export type ReopenMyProjectGroupResult = {
  group: {
    id: string
    status: "DRAFT" | string
    submittedAt: null
  }
}
