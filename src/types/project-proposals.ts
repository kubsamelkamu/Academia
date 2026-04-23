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

export interface ProposalDocumentAttachment {
  fileName?: string | null
  mimeType?: string | null
  sizeBytes?: number | null
  url?: string | null
  publicId?: string | null
  resourceType?: string | null
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

export interface ProposalDepartmentRef {
  id: string
  name?: string | null
}

export interface ProposalProjectRef {
  id: string
  title?: string | null
  description?: string | null
  status?: string | null
  advisorId?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  advisor?: ProposalParty | null
  milestones?: ProposalProjectMilestone[] | null
}

export interface ProposalMilestoneSubmissionFeedback {
  id: string
  submissionId?: string | null
  authorRole?: string | null
  message?: string | null
  attachmentFileName?: string | null
  attachmentMimeType?: string | null
  attachmentSizeBytes?: number | null
  attachmentUrl?: string | null
  attachmentPublicId?: string | null
  attachmentResourceType?: string | null
  createdAt?: string | null
  author?: ProposalParty | null
}

export interface ProposalMilestoneSubmission {
  id: string
  milestoneId?: string | null
  status?: string | null
  fileName?: string | null
  mimeType?: string | null
  sizeBytes?: number | null
  fileUrl?: string | null
  filePublicId?: string | null
  resourceType?: string | null
  approvedAt?: string | null
  createdAt?: string | null
  uploadedBy?: ProposalParty | null
  approvedBy?: ProposalParty | null
  feedbacks?: ProposalMilestoneSubmissionFeedback[] | null
}

export interface ProposalProjectMilestone {
  id: string
  projectId?: string | null
  title?: string | null
  description?: string | null
  dueDate?: string | null
  status?: string | null
  submittedAt?: string | null
  feedback?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  submissions?: ProposalMilestoneSubmission[] | null
}

export interface ProposalTransitionSummary {
  proposalId?: string | null
  projectId?: string | null
  advisorId?: string | null
  action?: string | null
}

export interface ProjectProposalFeedback {
  id: string
  proposalId?: string | null
  authorId?: string | null
  message: string
  author?: ProposalParty | null
  createdAt?: string | null
  updatedAt?: string | null
  authorName?: string | null
  authorEmail?: string | null
  authorRole?: string | null
}

export interface CreateProjectProposalFeedbackDto {
  message: string
}

export type ProposalTitleIndex = 0 | 1 | 2

export interface VoteProjectProposalTitleDto {
  titleIndex: ProposalTitleIndex
}

export interface ProjectProposalTitleVoteVoter {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  avatarUrl?: string | null
}

export interface ProjectProposalTitleVote {
  id: string
  proposalId: string
  voterId: string
  voterRole?: string | null
  titleIndex: ProposalTitleIndex
  createdAt?: string | null
  updatedAt?: string | null
  voter?: ProjectProposalTitleVoteVoter | null
}

export interface ProjectProposalTitleVotesResult {
  proposalId: string
  counts: Record<"0" | "1" | "2", number>
  votes: ProjectProposalTitleVote[]
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
  department?: ProposalDepartmentRef | null
  projectGroupId?: string | null
  advisorId?: string | null
  documents?: ProposalDocument[] | null
  feedback?: string | null
  submittedBy?: string | null
  submitter?: ProposalParty | null
  advisor?: ProposalParty | null
  project?: ProposalProjectRef | null
  transitionSummary?: ProposalTransitionSummary | null
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
