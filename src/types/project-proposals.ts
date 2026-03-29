export interface ProposalDocument {
  key: string
  url: string
  publicId?: string | null
  resourceType?: string | null
  mimeType?: string | null
  sizeBytes?: number | null
  uploadedAt?: string | null
}

export type ProposalStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | (string & {})

export interface ProjectProposal {
  id: string
  status: ProposalStatus
  titles?: string[]
  proposedTitles?: string[]
  title?: string
  description?: string | null
  documents: ProposalDocument[]
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
}

export interface CreateProjectProposalDraftDto {
  titles: [string, string, string]
  description?: string
}
