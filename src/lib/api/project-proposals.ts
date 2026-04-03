import apiClient from "@/lib/api/client"
import type {
  CreateProjectProposalDraftDto,
  DepartmentProjectProposalsResult,
  DepartmentProjectProposalsSummary,
  ProjectProposal,
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
