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

export interface ProjectProposalReviewSummary {
  proposalId?: string
  decision?: "APPROVED" | "REJECTED" | string
  selectedTitleIndex?: number | null
  selectedTitle?: string | null
  advisorId?: string | null
  feedback?: string | null
  reviewedByUserId?: string | null
  updatedAt?: string
}

export interface ProjectProposal {
  id: string
  status: ProposalStatus
  titles?: string[]
  proposedTitles?: string[]
  title?: string
  selectedTitleIndex?: number | null
  description?: string | null
  documents: ProposalDocument[]
  feedback?: string | null
  submittedBy?: string | null
  submitter?: {
    id: string
    firstName?: string
    lastName?: string
    email?: string
  } | null
  submittedAt?: string | null
  createdAt?: string
  updatedAt?: string
  reviewSummary?: ProjectProposalReviewSummary | null
}

export interface CreateProjectProposalDraftDto {
  titles: [string, string, string]
  description?: string
}
