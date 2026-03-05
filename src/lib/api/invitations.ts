import apiClient from "@/lib/api/client"
import type {
  AcceptInvitationDto,
  AcceptInvitationPreviewDto,
  AcceptInvitationPreviewResult,
  AcceptInvitationResult,
  BulkInviteJobEnqueueResult,
  BulkInviteJobStatus,
  BulkInviteStudentsDto,
  BulkInviteSyncResult,
  CreateTenantInvitationDto,
  InvitationStatus,
  ListTenantInvitationsParams,
  PreviewInvitationEmailDto,
  PreviewInvitationEmailResult,
  TenantInvitation,
} from "@/types/invitations"

type Envelope<T> = {
  success: boolean
  message?: string | string[]
  data?: T
}

function unwrapOrThrow<T>(payload: unknown): T {
  if (!payload || typeof payload !== "object") {
    return payload as T
  }

  if ("success" in payload) {
    const env = payload as Envelope<T>
    if (env.success) {
      return (env.data ?? (payload as unknown)) as T
    }
    const message = Array.isArray(env.message) ? env.message.join(", ") : env.message
    throw new Error(message || "Request failed")
  }

  return payload as T
}

async function postSameOrigin<T>(url: string, dto: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto ?? {}),
    cache: "no-store",
  })

  const text = await res.text()
  const json = text ? (JSON.parse(text) as unknown) : null

  // Throw helpful errors for non-2xx
  if (!res.ok) {
    try {
      unwrapOrThrow(json)
    } catch (e) {
      throw e
    }
    throw new Error("Request failed")
  }

  return unwrapOrThrow<T>(json)
}

export async function createTenantInvitation(
  dto: CreateTenantInvitationDto
): Promise<TenantInvitation> {
  const response = await apiClient.post<TenantInvitation>("/tenant/invitations", dto)
  return response.data
}

export async function bulkInviteStudentsSync(dto: BulkInviteStudentsDto): Promise<BulkInviteSyncResult> {
  const response = await apiClient.post<BulkInviteSyncResult>("/tenant/invitations/bulk", dto)
  return response.data
}

export async function bulkInviteStudentsAsyncJob(
  dto: BulkInviteStudentsDto
): Promise<BulkInviteJobEnqueueResult> {
  const response = await apiClient.post<BulkInviteJobEnqueueResult>(
    "/tenant/invitations/bulk/jobs",
    dto
  )
  return response.data
}

export async function previewInvitationEmail(
  dto: PreviewInvitationEmailDto
): Promise<PreviewInvitationEmailResult> {
  const response = await apiClient.post<PreviewInvitationEmailResult>(
    "/tenant/invitations/preview",
    dto
  )
  return response.data
}

export async function getBulkInviteJob(jobId: string): Promise<BulkInviteJobStatus> {
  const response = await apiClient.get<BulkInviteJobStatus>(`/tenant/invitations/bulk/jobs/${jobId}`)
  return response.data
}

export async function listTenantInvitations(
  params: ListTenantInvitationsParams = {}
): Promise<TenantInvitation[]> {
  const response = await apiClient.get<TenantInvitation[]>("/tenant/invitations", { params })
  return response.data
}

function dedupeById(invitations: TenantInvitation[]): TenantInvitation[] {
  const seen = new Set<string>()
  const next: TenantInvitation[] = []
  for (const invite of invitations) {
    if (seen.has(invite.id)) continue
    seen.add(invite.id)
    next.push(invite)
  }
  return next
}

function sortByCreatedAtDesc(invitations: TenantInvitation[]): TenantInvitation[] {
  return [...invitations].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime()
    const bTime = new Date(b.createdAt).getTime()
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime)
  })
}

export async function listAllTenantInvitations(): Promise<TenantInvitation[]> {
  const statuses: InvitationStatus[] = ["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"]
  const pages = await Promise.all(statuses.map((status) => listTenantInvitations({ status })))
  const merged = pages.flat()
  return sortByCreatedAtDesc(dedupeById(merged))
}

export async function revokeTenantInvitation(invitationId: string): Promise<void> {
  await apiClient.delete(`/tenant/invitations/${invitationId}`)
}

export async function resendTenantInvitation(invitationId: string): Promise<TenantInvitation> {
  const response = await apiClient.post<TenantInvitation>(`/tenant/invitations/${invitationId}/resend`)
  return response.data
}

export async function acceptInvitation(dto: AcceptInvitationDto): Promise<AcceptInvitationResult> {
  // Avoid CORS issues in the public accept flow by proxying through Next.js.
  if (typeof window !== "undefined") {
    return postSameOrigin<AcceptInvitationResult>("/api/invitations/accept", dto)
  }
  const response = await apiClient.post<AcceptInvitationResult>("/invitations/accept", dto)
  return response.data
}

export async function acceptInvitationPreview(
  dto: AcceptInvitationPreviewDto
): Promise<AcceptInvitationPreviewResult> {
  // Avoid CORS issues in the public accept flow by proxying through Next.js.
  if (typeof window !== "undefined") {
    return postSameOrigin<AcceptInvitationPreviewResult>(
      "/api/invitations/accept/preview",
      dto
    )
  }
  const response = await apiClient.post<AcceptInvitationPreviewResult>(
    "/invitations/accept/preview",
    dto
  )
  return response.data
}
