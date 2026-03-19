import apiClient from "@/lib/api/client"
import type {
  StudentProjectMilestone,
  StudentProjectMilestonesResult,
  StudentProjectsListResult,
  StudentProjectSummary,
} from "@/types/student-milestones"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

function toProjectSummary(raw: unknown): StudentProjectSummary | null {
  if (!isRecord(raw)) return null

  const id =
    asString(raw.id) ??
    asString(raw.projectId) ??
    asString(raw._id)

  if (!id) return null

  const title =
    asString(raw.title) ??
    asString(raw.name) ??
    asString(raw.projectTitle) ??
    "Untitled Project"

  const status = asString(raw.status) ?? "UNKNOWN"

  return {
    id,
    title,
    status,
    departmentId: asNullableString(raw.departmentId),
  }
}

function toProjectMilestone(raw: unknown, projectId: string): StudentProjectMilestone | null {
  if (!isRecord(raw)) return null

  const id = asString(raw.id) ?? asString(raw.milestoneId) ?? asString(raw._id)
  if (!id) return null

  const title =
    asString(raw.title) ??
    asString(raw.name) ??
    asString(raw.label) ??
    "Untitled Milestone"

  const dueDate =
    asString(raw.dueDate) ??
    asString(raw.deadline) ??
    asString(raw.targetDate) ??
    ""

  if (!dueDate) return null

  return {
    id,
    projectId: asString(raw.projectId) ?? projectId,
    title,
    description: asNullableString(raw.description),
    dueDate,
    status: asString(raw.status) ?? "PENDING",
    submittedAt: asNullableString(raw.submittedAt),
    feedback: asNullableString(raw.feedback),
  }
}

function extractItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  if (!isRecord(payload)) return []

  const fromItems = payload.items
  if (Array.isArray(fromItems)) return fromItems

  const fromProjects = payload.projects
  if (Array.isArray(fromProjects)) return fromProjects

  const fromMilestones = payload.milestones
  if (Array.isArray(fromMilestones)) return fromMilestones

  return []
}

export async function listStudentProjects(params: {
  departmentId: string
  studentId: string
}): Promise<StudentProjectsListResult> {
  const departmentId = params.departmentId.trim()
  const studentId = params.studentId.trim()

  if (!departmentId) throw new Error("departmentId is required")
  if (!studentId) throw new Error("studentId is required")

  const response = await apiClient.get<unknown>("/projects", {
    params: {
      departmentId,
      studentId,
    },
  })

  const items = extractItems(response.data)
    .map(toProjectSummary)
    .filter((item): item is StudentProjectSummary => Boolean(item))

  return { items }
}

export async function listProjectMilestones(projectId: string): Promise<StudentProjectMilestonesResult> {
  const trimmedProjectId = projectId.trim()
  if (!trimmedProjectId) throw new Error("projectId is required")

  const response = await apiClient.get<unknown>(`/projects/${encodeURIComponent(trimmedProjectId)}/milestones`)

  const items = extractItems(response.data)
    .map((item) => toProjectMilestone(item, trimmedProjectId))
    .filter((item): item is StudentProjectMilestone => Boolean(item))

  return { items }
}
