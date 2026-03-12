import apiClient from "@/lib/api/client"
import type {
  AvailableStudentListItem,
  AvailableStudentsPage,
  AvailableStudentsPagination,
  BrowseProjectGroupsPage,
  CancelProjectGroupJoinRequestResult,
  ApproveMyGroupJoinRequestResult,
  RejectMyGroupJoinRequestDto,
  RejectMyGroupJoinRequestResult,
  CreateProjectGroupJoinRequestDto,
  CreateProjectGroupJoinRequestResult,
  CreateProjectGroupInvitationDto,
  CreateProjectGroupInvitationResult,
  CreateProjectGroupDto,
  MyProjectGroupJoinRequestStatus,
  MyProjectGroupJoinRequestsPage,
  ProjectGroup,
  ProjectGroupDetails,
  MyGroupJoinRequestsPage,
  ProjectGroupMe,
  SubmitMyProjectGroupResult,
  ReopenMyProjectGroupResult,
} from "@/types/project-groups"
import type {
  AnnouncementDetails,
  AnnouncementItem,
  CreateMyGroupAnnouncementDto,
  UpdateMyGroupAnnouncementDto,
  ListAnnouncementsData,
} from "@/types/announcements"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []
}

function normalizeAvailableStudentListItem(payload: unknown): AvailableStudentListItem {
  if (!isRecord(payload)) {
    return {
      user: {
        id: "",
        email: null,
        firstName: null,
        lastName: null,
        avatarUrl: null,
        departmentId: null,
      },
      profile: {
        bio: null,
        githubUrl: null,
        linkedinUrl: null,
        portfolioUrl: null,
        techStack: [],
      },
    }
  }

  // Support either { user, profile } or a flattened object with user fields.
  const userRaw = ("user" in payload && isRecord(payload.user) ? payload.user : payload) as Record<string, unknown>
  const profileRaw = ("profile" in payload && isRecord(payload.profile) ? payload.profile : {}) as Record<string, unknown>

  const id = asNullableString(userRaw.id) ?? asNullableString(payload.userId) ?? ""

  return {
    user: {
      id,
      email: asNullableString(userRaw.email),
      firstName: asNullableString(userRaw.firstName),
      lastName: asNullableString(userRaw.lastName),
      avatarUrl: asNullableString(userRaw.avatarUrl),
      departmentId: asNullableString(userRaw.departmentId),
    },
    profile: {
      bio: asNullableString(profileRaw.bio),
      githubUrl: asNullableString(profileRaw.githubUrl),
      linkedinUrl: asNullableString(profileRaw.linkedinUrl),
      portfolioUrl: asNullableString(profileRaw.portfolioUrl),
      techStack: asStringArray(profileRaw.techStack),
    },
  }
}

function normalizeAvailableStudentsPagination(payload: unknown): AvailableStudentsPagination {
  const fallback: AvailableStudentsPagination = {
    total: 0,
    page: 1,
    limit: 20,
    pages: 1,
  }

  if (!isRecord(payload)) return fallback

  const asNumber = (value: unknown): number | null =>
    typeof value === "number" && Number.isFinite(value) ? value : null

  return {
    total: asNumber(payload.total) ?? fallback.total,
    page: asNumber(payload.page) ?? fallback.page,
    limit: asNumber(payload.limit) ?? fallback.limit,
    pages: asNumber(payload.pages) ?? fallback.pages,
  }
}

/**
 * Create a new project group for the current approved group leader.
 *
 * Note: `NEXT_PUBLIC_API_BASE_URL` is expected to include `/api/v1`.
 */
export async function createProjectGroup(dto: CreateProjectGroupDto): Promise<ProjectGroup> {
  const response = await apiClient.post<ProjectGroup>("/project-groups", dto)
  return response.data
}

/**
 * Fetch the current group for the approved group leader.
 *
 * Backend:
 * - 200: returns group + leader + members + pendingInvitationsCount
 * - 400: group not found for this leader
 */
export async function getMyProjectGroup(): Promise<ProjectGroupMe> {
  const response = await apiClient.get<ProjectGroupMe>("/project-groups/me")
  return response.data
}

export async function getAvailableStudents(params: {
  page?: number
  limit?: number
  search?: string
} = {}): Promise<AvailableStudentsPage> {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const search = params.search?.trim() ? params.search.trim() : undefined

  const response = await apiClient.get<unknown>("/project-groups/available-students", {
    params: {
      page,
      limit,
      ...(search ? { search } : null),
    },
  })

  const payload = response.data
  if (!isRecord(payload)) {
    throw new Error("Invalid available students response")
  }

  const rawItems = ("items" in payload && Array.isArray(payload.items) ? payload.items : []) as unknown[]
  const items = rawItems.map(normalizeAvailableStudentListItem).filter((item) => Boolean(item.user.id))

  const paginationRaw = "pagination" in payload ? payload.pagination : undefined
  const pagination = normalizeAvailableStudentsPagination(paginationRaw)

  return {
    items,
    pagination,
  }
}

export async function createProjectGroupInvitation(
  dto: CreateProjectGroupInvitationDto
): Promise<CreateProjectGroupInvitationResult> {
  const response = await apiClient.post<CreateProjectGroupInvitationResult>("/project-groups/invitations", dto)
  return response.data
}

export async function browseProjectGroups(params: {
  page?: number
  limit?: number
  search?: string
} = {}): Promise<BrowseProjectGroupsPage> {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const search = params.search?.trim() ? params.search.trim() : undefined

  const response = await apiClient.get<BrowseProjectGroupsPage>("/project-groups/browse", {
    params: {
      page,
      limit,
      ...(search ? { search } : null),
    },
  })

  return response.data
}

export async function getProjectGroupDetails(groupId: string): Promise<ProjectGroupDetails> {
  const trimmed = groupId.trim()
  if (!trimmed) {
    throw new Error("groupId is required")
  }

  const response = await apiClient.get<ProjectGroupDetails>(`/project-groups/${encodeURIComponent(trimmed)}`)
  return response.data
}

export async function createProjectGroupJoinRequest(
  groupId: string,
  dto: CreateProjectGroupJoinRequestDto = {}
): Promise<CreateProjectGroupJoinRequestResult> {
  const trimmed = groupId.trim()
  if (!trimmed) {
    throw new Error("groupId is required")
  }

  const message = dto.message?.trim()

  const response = await apiClient.post<CreateProjectGroupJoinRequestResult>(
    `/project-groups/${encodeURIComponent(trimmed)}/join-requests`,
    message ? { message } : {}
  )

  return response.data
}

export async function getMyProjectGroupJoinRequests(params: {
  page?: number
  limit?: number
  status?: MyProjectGroupJoinRequestStatus | string
} = {}): Promise<MyProjectGroupJoinRequestsPage> {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const status = params.status?.trim() ? params.status.trim() : undefined

  const response = await apiClient.get<MyProjectGroupJoinRequestsPage>("/project-groups/join-requests/me", {
    params: {
      page,
      limit,
      ...(status ? { status } : null),
    },
  })

  return response.data
}

export async function getMyGroupJoinRequests(params: {
  page?: number
  limit?: number
  status?: MyProjectGroupJoinRequestStatus | string
} = {}): Promise<MyGroupJoinRequestsPage> {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const status = params.status?.trim() ? params.status.trim() : undefined

  const response = await apiClient.get<MyGroupJoinRequestsPage>("/project-groups/me/join-requests", {
    params: {
      page,
      limit,
      ...(status ? { status } : null),
    },
  })

  return response.data
}

export async function approveMyGroupJoinRequest(requestId: string): Promise<ApproveMyGroupJoinRequestResult> {
  const trimmed = requestId.trim()
  if (!trimmed) {
    throw new Error("requestId is required")
  }

  const response = await apiClient.post<ApproveMyGroupJoinRequestResult>(
    `/project-groups/me/join-requests/${encodeURIComponent(trimmed)}/approve`
  )

  return response.data
}

export async function rejectMyGroupJoinRequest(
  requestId: string,
  dto: RejectMyGroupJoinRequestDto = {}
): Promise<RejectMyGroupJoinRequestResult> {
  const trimmed = requestId.trim()
  if (!trimmed) {
    throw new Error("requestId is required")
  }

  const reason = dto.reason?.trim()

  const response = await apiClient.post<RejectMyGroupJoinRequestResult>(
    `/project-groups/me/join-requests/${encodeURIComponent(trimmed)}/reject`,
    reason ? { reason } : {}
  )

  return response.data
}

export async function submitMyProjectGroup(): Promise<SubmitMyProjectGroupResult> {
  const response = await apiClient.post<SubmitMyProjectGroupResult>("/project-groups/me/submit")
  return response.data
}

export async function reopenMyProjectGroup(): Promise<ReopenMyProjectGroupResult> {
  const response = await apiClient.post<ReopenMyProjectGroupResult>("/project-groups/me/reopen")
  return response.data
}

export async function listMyGroupAnnouncements(params: {
  page?: number
  limit?: number
} = {}): Promise<ListAnnouncementsData> {
  const page = params.page ?? 1
  const limit = params.limit ?? 20

  const response = await apiClient.get<ListAnnouncementsData>("/project-groups/me/announcements", {
    params: {
      page,
      limit,
    },
  })

  return response.data
}

export async function createMyGroupAnnouncement(dto: CreateMyGroupAnnouncementDto): Promise<AnnouncementItem> {
  const title = dto.title.trim()
  const message = dto.message.trim()
  const attachmentUrl = dto.attachmentUrl?.trim() ? dto.attachmentUrl.trim() : undefined

  if (!title) {
    throw new Error("title is required")
  }
  if (!message) {
    throw new Error("message is required")
  }

  if (dto.attachment && attachmentUrl) {
    throw new Error("Provide either attachment or attachmentUrl, not both")
  }

  const formData = new FormData()
  formData.append("title", title)
  formData.append("priority", dto.priority)
  formData.append("message", message)

  if (dto.attachment) {
    const maxBytes = 5 * 1024 * 1024
    if (dto.attachment.size > maxBytes) {
      throw new Error("Attachment must be 5MB or less")
    }
    formData.append("attachment", dto.attachment)
  } else if (attachmentUrl) {
    formData.append("attachmentUrl", attachmentUrl)
  }

  const response = await apiClient.post<AnnouncementItem>("/project-groups/me/announcements", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return response.data
}

export async function getMyGroupAnnouncementById(announcementId: string): Promise<AnnouncementDetails> {
  const trimmed = announcementId.trim()
  if (!trimmed) {
    throw new Error("announcementId is required")
  }

  const response = await apiClient.get<AnnouncementDetails>(
    `/project-groups/me/announcements/${encodeURIComponent(trimmed)}`
  )

  return response.data
}

export async function updateMyGroupAnnouncement(
  announcementId: string,
  dto: UpdateMyGroupAnnouncementDto
): Promise<AnnouncementItem> {
  const trimmedId = announcementId.trim()
  if (!trimmedId) {
    throw new Error("announcementId is required")
  }

  const title = dto.title?.trim()
  const message = dto.message?.trim()
  const attachmentUrl = dto.attachmentUrl?.trim() ? dto.attachmentUrl.trim() : undefined
  const removeAttachment = dto.removeAttachment === true

  const attachmentOps = Number(Boolean(dto.attachment)) + Number(Boolean(attachmentUrl)) + Number(removeAttachment)
  if (attachmentOps > 1) {
    throw new Error("Choose only one attachment operation: attachment, attachmentUrl, or removeAttachment")
  }

  const hasAnyUpdate =
    typeof title === "string" ||
    typeof message === "string" ||
    typeof dto.priority === "string" ||
    attachmentOps === 1

  if (!hasAnyUpdate) {
    throw new Error("No updates provided")
  }

  if (typeof title === "string" && !title) {
    throw new Error("title cannot be empty")
  }
  if (typeof message === "string" && !message) {
    throw new Error("message cannot be empty")
  }

  const formData = new FormData()
  if (typeof title === "string") formData.append("title", title)
  if (typeof dto.priority === "string") formData.append("priority", dto.priority)
  if (typeof message === "string") formData.append("message", message)

  if (dto.attachment) {
    const maxBytes = 5 * 1024 * 1024
    if (dto.attachment.size > maxBytes) {
      throw new Error("Attachment must be 5MB or less")
    }
    formData.append("attachment", dto.attachment)
  } else if (attachmentUrl) {
    formData.append("attachmentUrl", attachmentUrl)
  } else if (removeAttachment) {
    formData.append("removeAttachment", "true")
  }

  const response = await apiClient.patch<AnnouncementItem>(
    `/project-groups/me/announcements/${encodeURIComponent(trimmedId)}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )

  return response.data
}

export async function cancelProjectGroupJoinRequest(requestId: string): Promise<CancelProjectGroupJoinRequestResult> {
  const trimmed = requestId.trim()
  if (!trimmed) {
    throw new Error("requestId is required")
  }

  const response = await apiClient.delete<CancelProjectGroupJoinRequestResult>(
    `/project-groups/join-requests/${encodeURIComponent(trimmed)}`
  )

  return response.data
}
