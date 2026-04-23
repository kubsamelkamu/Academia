import apiClient from "@/lib/api/client"
import type {
  CreateProjectProposalFeedbackDto,
  CreateProjectProposalRejectionReminderDto,
  CreateProjectProposalDraftDto,
  DepartmentProjectProposalsResult,
  DepartmentProjectProposalsSummary,
  ProjectProposalTitleVote,
  ProjectProposalTitleVotesResult,
  ProjectProposal,
  ProjectProposalFeedback,
  ProjectProposalRejectionReminder,
  VoteProjectProposalTitleDto,
  UpdateProjectProposalStatusDto,
} from "@/types/project-proposals"

const EMPTY_SUMMARY: DepartmentProjectProposalsSummary = {
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  draft: 0,
}

function extractProposalItems(payload: unknown): ProjectProposal[] {
  if (Array.isArray(payload)) return payload as ProjectProposal[]
  if (!payload || typeof payload !== "object") return []

  const candidate = (payload as { items?: unknown }).items
  if (Array.isArray(candidate)) return candidate as ProjectProposal[]
  return []
}

function extractProposalSummary(payload: unknown): DepartmentProjectProposalsSummary {
  if (!payload || typeof payload !== "object") {
    return EMPTY_SUMMARY
  }

  const candidate = (payload as { summary?: unknown }).summary
  if (!candidate || typeof candidate !== "object") {
    return {
      ...EMPTY_SUMMARY,
      total: extractProposalItems(payload).length,
    }
  }

  return {
    total: Number((candidate as { total?: unknown }).total ?? 0),
    pending: Number((candidate as { pending?: unknown }).pending ?? 0),
    approved: Number((candidate as { approved?: unknown }).approved ?? 0),
    rejected: Number((candidate as { rejected?: unknown }).rejected ?? 0),
    draft: Number((candidate as { draft?: unknown }).draft ?? 0),
  }
}

function extractDepartmentProposalResult(payload: unknown): DepartmentProjectProposalsResult {
  const items = extractProposalItems(payload)

  return {
    items,
    summary: extractProposalSummary(payload),
  }
}

function asNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function extractFeedbackAuthorName(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const record = value as Record<string, unknown>
  const firstName = asNullableString(record.firstName)
  const lastName = asNullableString(record.lastName)
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim()

  return (
    fullName ||
    asNullableString(record.fullName) ||
    asNullableString(record.name) ||
    asNullableString(record.email)
  )
}

function normalizeProposalFeedback(raw: unknown, index: number): ProjectProposalFeedback | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null
  }

  const record = raw as Record<string, unknown>
  const message =
    asNullableString(record.message) ||
    asNullableString(record.feedback) ||
    asNullableString(record.comment) ||
    asNullableString(record.content) ||
    asNullableString(record.note) ||
    asNullableString(record.text)

  if (!message) {
    return null
  }

  const author =
    (record.author && typeof record.author === "object" ? record.author : null) ||
    (record.createdBy && typeof record.createdBy === "object" ? record.createdBy : null) ||
    (record.user && typeof record.user === "object" ? record.user : null)

  const proposalId = asNullableString(record.proposalId) || asNullableString(record.projectProposalId)
  const authorId = asNullableString(record.authorId) || asNullableString(record.createdById) || asNullableString(record.userId)

  return {
    id: asNullableString(record.id) || `proposal-feedback-${index}`,
    proposalId,
    authorId,
    message,
    createdAt: asNullableString(record.createdAt) || asNullableString(record.timestamp),
    updatedAt: asNullableString(record.updatedAt),
    author: author as unknown as ProjectProposalFeedback["author"],
    authorName: extractFeedbackAuthorName(author) || asNullableString(record.authorName),
    authorEmail:
      (author && typeof author === "object" ? asNullableString((author as Record<string, unknown>).email) : null) ||
      asNullableString(record.authorEmail),
    authorRole:
      (author && typeof author === "object" ? asNullableString((author as Record<string, unknown>).role) : null) ||
      asNullableString(record.authorRole),
  }
}

function extractProposalFeedbackItems(payload: unknown): ProjectProposalFeedback[] {
  const items = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown }).items)
      ? (payload as { items: unknown[] }).items
      : []

  return items
    .map((item, index) => normalizeProposalFeedback(item, index))
    .filter((item): item is ProjectProposalFeedback => Boolean(item))
}

export async function createProposalDraft(dto: CreateProjectProposalDraftDto): Promise<ProjectProposal> {
  const titles = dto.titles
  const cleanedTitles = titles.map((title) => title.trim()) as [string, string, string]
  if (cleanedTitles.some((title) => !title)) {
    throw new Error("titles must include 3 non-empty values")
  }

  const payload: { titles: [string, string, string]; description?: string } = {
    titles: cleanedTitles,
  }

  const description = dto.description?.trim()
  if (description) {
    payload.description = description
  }

  const response = await apiClient.post<ProjectProposal>("/projects/proposals", payload)
  return response.data
}

export async function createProposalWithProposalPdf(params: {
  titles: [string, string, string]
  description?: string
  proposalPdf: File
}): Promise<ProjectProposal> {
  const form = new FormData()
  for (const title of params.titles) {
    form.append("titles", title)
  }

  const description = params.description?.trim()
  if (description) {
    form.append("description", description)
  }

  form.append("proposalPdf", params.proposalPdf)

  const response = await apiClient.post<ProjectProposal>(
    "/projects/proposals/with-proposal-pdf",
    form,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )

  return response.data
}

export async function submitProposalForReview(proposalId: string): Promise<ProjectProposal> {
  const trimmed = proposalId.trim()
  if (!trimmed) throw new Error("proposalId is required")

  const response = await apiClient.post<ProjectProposal>(
    `/projects/proposals/${encodeURIComponent(trimmed)}/submit`
  )

  return response.data
}

export async function listMyGroupProposals(): Promise<ProjectProposal[]> {
  const response = await apiClient.get<unknown>("/projects/proposals/group")
  return extractProposalItems(response.data)
}

export async function getProjectProposalById(proposalId: string): Promise<ProjectProposal> {
  const trimmedProposalId = proposalId.trim()
  if (!trimmedProposalId) {
    throw new Error("proposalId is required")
  }

  const response = await apiClient.get<ProjectProposal>(
    `/projects/proposals/${encodeURIComponent(trimmedProposalId)}`
  )

  return response.data
}

export async function listDepartmentProposals(departmentId: string): Promise<DepartmentProjectProposalsResult> {
  const trimmedDepartmentId = departmentId.trim()
  if (!trimmedDepartmentId) {
    throw new Error("departmentId is required")
  }

  const response = await apiClient.get<unknown>("/projects/proposals", {
    params: {
      departmentId: trimmedDepartmentId,
    },
  })

  return extractDepartmentProposalResult(response.data)
}

export async function listProposalFeedbacks(proposalId: string): Promise<ProjectProposalFeedback[]> {
  const trimmedProposalId = proposalId.trim()
  if (!trimmedProposalId) {
    throw new Error("proposalId is required")
  }

  const response = await apiClient.get<unknown>(
    `/projects/proposals/${encodeURIComponent(trimmedProposalId)}/feedbacks`
  )

  return extractProposalFeedbackItems(response.data)
}

export async function createProposalFeedback(
  proposalId: string,
  dto: CreateProjectProposalFeedbackDto
): Promise<ProjectProposalFeedback> {
  const trimmedProposalId = proposalId.trim()
  if (!trimmedProposalId) {
    throw new Error("proposalId is required")
  }

  const message = dto.message?.trim()
  if (!message) {
    throw new Error("message is required")
  }

  const response = await apiClient.post<unknown>(
    `/projects/proposals/${encodeURIComponent(trimmedProposalId)}/feedbacks`,
    { message }
  )

  return (
    normalizeProposalFeedback(response.data, 0) ??
    ({ id: `proposal-feedback-${Date.now()}`, message } satisfies ProjectProposalFeedback)
  )
}

export async function voteProjectProposalTitle(
  proposalId: string,
  dto: VoteProjectProposalTitleDto
): Promise<ProjectProposalTitleVote> {
  const trimmedProposalId = proposalId.trim()
  if (!trimmedProposalId) {
    throw new Error("proposalId is required")
  }

  const titleIndex = dto.titleIndex
  if (typeof titleIndex !== "number" || Number.isNaN(titleIndex) || titleIndex < 0 || titleIndex > 2) {
    throw new Error("titleIndex must be 0, 1, or 2")
  }

  const response = await apiClient.post<ProjectProposalTitleVote>(
    `/projects/proposals/${encodeURIComponent(trimmedProposalId)}/title-votes`,
    { titleIndex }
  )

  return response.data
}

export async function getProjectProposalTitleVotes(proposalId: string): Promise<ProjectProposalTitleVotesResult> {
  const trimmedProposalId = proposalId.trim()
  if (!trimmedProposalId) {
    throw new Error("proposalId is required")
  }

  const response = await apiClient.get<ProjectProposalTitleVotesResult>(
    `/projects/proposals/${encodeURIComponent(trimmedProposalId)}/title-votes`
  )

  return response.data
}

export async function updateProposalStatus(
  proposalId: string,
  dto: UpdateProjectProposalStatusDto
): Promise<ProjectProposal> {
  const trimmedProposalId = proposalId.trim()
  if (!trimmedProposalId) {
    throw new Error("proposalId is required")
  }

  const status = String(dto.status ?? "").trim().toUpperCase()
  if (status !== "APPROVED" && status !== "REJECTED") {
    throw new Error("status must be APPROVED or REJECTED")
  }

  const payload: UpdateProjectProposalStatusDto = {
    status,
  }

  if (status === "APPROVED") {
    if (
      typeof dto.approvedTitleIndex !== "number" ||
      Number.isNaN(dto.approvedTitleIndex) ||
      dto.approvedTitleIndex < 0 ||
      dto.approvedTitleIndex > 2
    ) {
      throw new Error("approvedTitleIndex must be 0, 1, or 2 when approving")
    }

    payload.approvedTitleIndex = dto.approvedTitleIndex
  }

  if (status === "REJECTED") {
    const feedback = dto.feedback?.trim()
    if (!feedback) {
      throw new Error("feedback is required when rejecting")
    }

    payload.feedback = feedback
  }

  if (dto.advisorId?.trim()) {
    payload.advisorId = dto.advisorId.trim()
  }

  const response = await apiClient.put<ProjectProposal>(
    `/projects/proposals/${encodeURIComponent(trimmedProposalId)}/status`,
    payload
  )

  return response.data
}

export async function createProposalRejectionReminder(
  proposalId: string,
  dto: CreateProjectProposalRejectionReminderDto
): Promise<ProjectProposalRejectionReminder> {
  const trimmedProposalId = proposalId.trim()
  if (!trimmedProposalId) {
    throw new Error("proposalId is required")
  }

  const deadlineAt = dto.deadlineAt?.trim()
  if (!deadlineAt) {
    throw new Error("deadlineAt is required")
  }

  const payload: CreateProjectProposalRejectionReminderDto = {
    deadlineAt,
  }

  const title = dto.title?.trim()
  if (title) {
    payload.title = title
  }

  const message = dto.message?.trim()
  if (message) {
    payload.message = message
  }

  if (typeof dto.disableAfterDeadline === "boolean") {
    payload.disableAfterDeadline = dto.disableAfterDeadline
  }

  const response = await apiClient.post<ProjectProposalRejectionReminder>(
    `/projects/proposals/${encodeURIComponent(trimmedProposalId)}/rejection-reminder`,
    payload
  )

  return response.data
}
