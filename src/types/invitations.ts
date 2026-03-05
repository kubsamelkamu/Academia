export type InvitationRoleName = "Student" | "Advisor" | "Coordinator"

export type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED"

export type TenantInvitation = {
  id: string
  tenantId: string
  departmentId: string
  email: string
  firstName?: string
  lastName?: string
  roleName: InvitationRoleName
  status: InvitationStatus
  expiresAt: string
  createdAt: string
  acceptedAt?: string | null
  revokedAt?: string | null
  lastSentAt?: string | null
  sendCount?: number | string
  lastSendError?: string | null
}

export type CreateTenantInvitationDto = {
  email: string
  firstName: string
  lastName: string
  roleName: InvitationRoleName
  subject?: string
  message?: string
}

export type BulkInviteStudentItemDto = {
  email: string
  firstName: string
  lastName: string
}

export type BulkInviteStudentsDto = {
  invites: BulkInviteStudentItemDto[]
  subject?: string
  message?: string
}

export type PreviewInvitationEmailDto = {
  roleName: InvitationRoleName
  firstName?: string
  lastName?: string
  subject?: string
  message?: string
}

export type PreviewInvitationEmailResult = {
  subject: string
  htmlContent: string
  textContent: string
  acceptUrl: string
  loginUrl: string
  expiresAt: string
}

export type BulkInviteSyncResult = {
  requested: number
  unique: number
  created: number
  skippedExisting: number
  duplicates: string[]
  invitations: TenantInvitation[]
}

export type BulkInviteJobEnqueueResult = {
  jobId: string
  enqueued: boolean
  requested: number
  maxPerRequest: number
}

export type BulkInviteJobState =
  | "waiting"
  | "active"
  | "completed"
  | "failed"
  | string

export type BulkInviteJobStatus = {
  jobId: string
  state: BulkInviteJobState
  progress?: Record<string, unknown>
  result?: BulkInviteSyncResult
  failedReason?: string
}

export type ListTenantInvitationsParams = {
  status?: InvitationStatus
}

export type AcceptInvitationDto = {
  token: string
}

export type AcceptInvitationPreviewDto = {
  token: string
}

export type AcceptInvitationPreviewResult = {
  invitationId: string
  tenantId: string
  tenantName: string
  tenantDomain: string
  departmentId: string
  departmentName: string
  email: string
  firstName: string
  lastName: string
  roleName: InvitationRoleName
  status: InvitationStatus
  expiresAt: string
}

export type AcceptInvitationResult = {
  accepted: true
  userId: string
  tenantId: string
  email: string
  temporaryPassword: string
  mustChangePassword: true
  updatedDepartmentIds: string[]
}
