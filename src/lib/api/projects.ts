import apiClient from "@/lib/api/client"
import type {
  AssignProjectAdvisorDto,
  DepartmentProjectAdvisorDirectoryItem,
  DepartmentProjectsOverview,
  ProjectAssignmentSummary,
  ProjectEligibleEvaluatorDirectoryItem,
  ProjectEligibleEvaluatorsResponse,
  ProjectEvaluatorAssignment,
  ProjectDetail,
  UpdateProjectEvaluatorsDto,
  UpdateProjectEvaluatorsResponse,
} from "@/types/projects"

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value.map((item) => asString(item).trim()).filter(Boolean)
}

function toProjectEligibleEvaluator(raw: unknown): ProjectEligibleEvaluatorDirectoryItem | null {
  const data = asObject(raw)
  if (!data) return null

  const id = asString(data.id).trim()
  const userId = asString(data.userId).trim()
  const departmentId = asString(data.departmentId).trim()

  if (!id || !userId || !departmentId) {
    return null
  }

  const userData = asObject(data.user)

  return {
    id,
    userId,
    departmentId,
    loadLimit: asNumber(data.loadLimit, 0),
    currentLoad: asNumber(data.currentLoad, 0),
    user: userData
      ? {
          id: asString(userData.id).trim() || userId,
          firstName: asString(userData.firstName) || undefined,
          lastName: asString(userData.lastName) || undefined,
          email: asString(userData.email) || undefined,
          avatarUrl: asString(userData.avatarUrl) || null,
          status: asString(userData.status) || undefined,
        }
      : null,
  }
}

function toProjectEvaluatorAssignment(
  raw: unknown,
  fallback: { projectId?: string | null } = {}
): ProjectEvaluatorAssignment | null {
  const data = asObject(raw)
  if (!data) return null

  const projectId = asString(data.projectId).trim() || asString(fallback.projectId).trim()
  const userId = asString(data.userId).trim() || asString(data.evaluatorUserId).trim()
  const id = asString(data.id).trim() || (projectId && userId ? `${projectId}:${userId}` : "")

  if (!projectId || !userId) {
    return null
  }

  // Backends commonly return evaluator info as either `user` or `evaluator`.
  const userData = asObject(data.user) ?? asObject(data.evaluator)

  return {
    id,
    projectId,
    userId,
    departmentId: asString(data.departmentId).trim() || null,
    createdAt: asString(data.createdAt).trim() || null,
    updatedAt: asString(data.updatedAt).trim() || null,
    user: userData
      ? {
          id: asString(userData.id).trim() || userId,
          firstName: asString(userData.firstName) || undefined,
          lastName: asString(userData.lastName) || undefined,
          email: asString(userData.email) || undefined,
          avatarUrl: asString(userData.avatarUrl) || null,
          status: asString(userData.status) || undefined,
        }
      : null,
  }
}

export async function getProjectDetails(projectId: string): Promise<ProjectDetail> {
  const trimmed = projectId.trim()
  if (!trimmed) {
    throw new Error("projectId is required")
  }

  const response = await apiClient.get<ProjectDetail>(`/projects/${encodeURIComponent(trimmed)}`)
  return response.data
}

export async function getDepartmentProjectsOverview(
  departmentId: string
): Promise<DepartmentProjectsOverview> {
  const trimmed = departmentId.trim()
  if (!trimmed) {
    throw new Error("departmentId is required")
  }

  const response = await apiClient.get<DepartmentProjectsOverview>(
    `/analytics/department/overview?departmentId=${encodeURIComponent(trimmed)}`
  )

  return response.data
}

export async function getDepartmentProjectAdvisors(
  departmentId: string
): Promise<DepartmentProjectAdvisorDirectoryItem[]> {
  const trimmed = departmentId.trim()
  if (!trimmed) {
    throw new Error("departmentId is required")
  }

  const response = await apiClient.get<DepartmentProjectAdvisorDirectoryItem[]>(
    `/projects/advisors?departmentId=${encodeURIComponent(trimmed)}`
  )

  return Array.isArray(response.data) ? response.data : []
}

export async function getProjectAssignmentSummary(
  departmentId: string
): Promise<ProjectAssignmentSummary> {
  const trimmed = departmentId.trim()
  if (!trimmed) {
    throw new Error("departmentId is required")
  }

  const response = await apiClient.get<ProjectAssignmentSummary>(
    `/projects/assignment-summary?departmentId=${encodeURIComponent(trimmed)}`
  )

  return response.data
}

export async function getProjectEligibleEvaluators(
  projectId: string
): Promise<ProjectEligibleEvaluatorsResponse> {
  const trimmed = projectId.trim()

  if (!trimmed) {
    throw new Error("projectId is required")
  }

  const response = await apiClient.get<
    | {
        data?: unknown
      }
    | ProjectEligibleEvaluatorsResponse
  >(
    `/projects/${encodeURIComponent(trimmed)}/evaluators/eligible`
  )
  const root = asObject(response.data) ?? {}
  const payload = asObject(root.data) ?? root

  return {
    projectId: asString(payload.projectId).trim() || trimmed,
    excludedUserIds: asStringArray(payload.excludedUserIds),
    eligible: Array.isArray(payload.eligible)
      ? payload.eligible
          .map((item) => toProjectEligibleEvaluator(item))
          .filter((item): item is ProjectEligibleEvaluatorDirectoryItem => item !== null)
      : [],
  }
}

export async function assignProjectAdvisor(
  projectId: string,
  dto: AssignProjectAdvisorDto
): Promise<ProjectDetail> {
  const trimmedProjectId = projectId.trim()
  const advisorId = dto.advisorId.trim()

  if (!trimmedProjectId) {
    throw new Error("projectId is required")
  }

  if (!advisorId) {
    throw new Error("advisorId is required")
  }

  const response = await apiClient.put<ProjectDetail>(
    `/projects/${encodeURIComponent(trimmedProjectId)}/advisor`,
    { advisorId }
  )

  return response.data
}

export async function updateProjectEvaluators(
  projectId: string,
  dto: UpdateProjectEvaluatorsDto
): Promise<UpdateProjectEvaluatorsResponse> {
  const trimmedProjectId = projectId.trim()

  if (!trimmedProjectId) {
    throw new Error("projectId is required")
  }

  const evaluatorIds = Array.isArray(dto.evaluatorIds)
    ? dto.evaluatorIds.map((id) => String(id).trim()).filter(Boolean)
    : []

  const response = await apiClient.put<
    | {
        data?: unknown
      }
    | UpdateProjectEvaluatorsResponse
  >(`/projects/${encodeURIComponent(trimmedProjectId)}/evaluators`, {
    evaluatorIds,
  })

  const root = asObject(response.data) ?? {}
  const payload = asObject(root.data) ?? root

  return {
    projectId: asString(payload.projectId).trim() || trimmedProjectId,
    evaluators: Array.isArray(payload.evaluators)
      ? payload.evaluators
          .map((item) => toProjectEvaluatorAssignment(item, { projectId: trimmedProjectId }))
          .filter((item): item is ProjectEvaluatorAssignment => item !== null)
      : [],
  }
}

export async function getProjectEvaluators(projectId: string): Promise<UpdateProjectEvaluatorsResponse> {
  const trimmedProjectId = projectId.trim()

  if (!trimmedProjectId) {
    throw new Error("projectId is required")
  }

  const response = await apiClient.get<
    | {
        data?: unknown
      }
    | UpdateProjectEvaluatorsResponse
  >(`/projects/${encodeURIComponent(trimmedProjectId)}/evaluators`)

  const root = asObject(response.data) ?? {}
  const dataPayload = root.data
  const payload = asObject(dataPayload) ?? root

  return {
    projectId: asString(payload.projectId).trim() || trimmedProjectId,
    evaluators: Array.isArray((payload as Record<string, unknown>).evaluators)
      ? ((payload as Record<string, unknown>).evaluators as unknown[])
          .map((item) => toProjectEvaluatorAssignment(item, { projectId: trimmedProjectId }))
          .filter((item): item is ProjectEvaluatorAssignment => item !== null)
      : Array.isArray(dataPayload)
        ? dataPayload
            .map((item) => toProjectEvaluatorAssignment(item, { projectId: trimmedProjectId }))
            .filter((item): item is ProjectEvaluatorAssignment => item !== null)
        : Array.isArray(response.data)
          ? (response.data as unknown[])
              .map((item) => toProjectEvaluatorAssignment(item, { projectId: trimmedProjectId }))
              .filter((item): item is ProjectEvaluatorAssignment => item !== null)
          : [],
  }
}

export async function removeProjectEvaluator(
  projectId: string,
  evaluatorUserId: string
): Promise<{ projectId: string; evaluatorUserId: string; removed: boolean }> {
  const trimmedProjectId = projectId.trim()
  const trimmedEvaluatorUserId = evaluatorUserId.trim()

  if (!trimmedProjectId) {
    throw new Error("projectId is required")
  }
  if (!trimmedEvaluatorUserId) {
    throw new Error("evaluatorUserId is required")
  }

  await apiClient.delete(
    `/projects/${encodeURIComponent(trimmedProjectId)}/evaluators/${encodeURIComponent(trimmedEvaluatorUserId)}`
  )

  return { projectId: trimmedProjectId, evaluatorUserId: trimmedEvaluatorUserId, removed: true }
}
