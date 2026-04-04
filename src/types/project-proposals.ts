export interface ProposalDocument {
  key: string
  url: string
  publicId?: string | null
  resourceType?: string | null
  mimeType?: string | null
  sizeBytes?: number | null
  uploadedAt?: string | null
  originalName?: string | null
}

export type ProposalStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | (string & {})

export interface ProposalParty {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  avatarUrl?: string | null
}

export interface ProposalGroupMember {
  user?: ProposalParty | null
}

export interface ProposalProjectGroup {
  id: string
  name?: string | null
  leaderUserId?: string | null
  leader?: ProposalParty | null
  members?: ProposalGroupMember[] | null
}

export interface ProjectProposalFeedback {
  id: string
  message: string
  createdAt?: string | null
  updatedAt?: string | null
  authorName?: string | null
  authorEmail?: string | null
  authorRole?: string | null
}

export interface CreateProjectProposalRejectionReminderDto {
  deadlineAt: string
  title?: string
  message?: string
  disableAfterDeadline?: boolean
}

export interface ProjectProposalRejectionReminder {
  id: string
  proposalId: string
  projectGroupId?: string | null
  title?: string | null
  message?: string | null
  kind?: string | null
  deadlineAt?: string | null
  disableAfterDeadline?: boolean | null
  expiredAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface DepartmentProjectProposalsSummary {
  total: number
  pending: number
  approved: number
  rejected: number
  draft: number
}

export interface DepartmentProjectProposalsResult {
  items: ProjectProposal[]
  summary: DepartmentProjectProposalsSummary
}

export interface ProjectProposal {
  id: string
  status: ProposalStatus
  titles?: string[]
  proposedTitles?: string[]
  selectedTitleIndex?: number | null
  title?: string
  description?: string | null
  tenantId?: string | null
  departmentId?: string | null
  projectGroupId?: string | null
  advisorId?: string | null
  documents?: ProposalDocument[] | null
  feedback?: string | null
  submittedBy?: string | null
  submitter?: ProposalParty | null
  advisor?: ProposalParty | null
  projectGroup?: ProposalProjectGroup | null
  submittedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface CreateProjectProposalDraftDto {
  titles: [string, string, string]
  description?: string
}

export interface UpdateProjectProposalStatusDto {
  status: "APPROVED" | "REJECTED"
  feedback?: string
  advisorId?: string
  approvedTitleIndex?: number
}
