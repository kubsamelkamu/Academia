import apiClient from "@/lib/api/client"
import type { CreateProjectProposalDraftDto, ProjectProposal } from "@/types/project-proposals"

function extractProposalItems(payload: unknown): ProjectProposal[] {
  if (Array.isArray(payload)) return payload as ProjectProposal[]
  if (!payload || typeof payload !== "object") return []

  const candidate = (payload as { items?: unknown }).items
  if (Array.isArray(candidate)) return candidate as ProjectProposal[]
  return []
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
