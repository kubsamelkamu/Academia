import apiClient from "@/lib/api/client"
import type {
  AvailableStudentListItem,
  AvailableStudentsPage,
  AvailableStudentsPagination,
  CreateProjectGroupDto,
  ProjectGroup,
  ProjectGroupMe,
} from "@/types/project-groups"

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
