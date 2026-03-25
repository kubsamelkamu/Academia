import apiClient from "@/lib/api/client"
import type {
  CreateProjectGroupTaskDto,
  CreateProjectGroupTaskResult,
  DeleteProjectGroupTaskResult,
  GetProjectGroupTaskResult,
  ListProjectGroupTasksResult,
  ProjectGroupTaskStatus,
  UpdateProjectGroupTaskDto,
} from "@/types/project-group-tasks"

const BASE_PATH = "/project-groups/me/tasks"

export async function createMyProjectGroupTask(
  dto: CreateProjectGroupTaskDto
): Promise<CreateProjectGroupTaskResult> {
  const response = await apiClient.post<CreateProjectGroupTaskResult>(BASE_PATH, dto)
  return response.data
}

export async function listMyProjectGroupTasks(): Promise<ListProjectGroupTasksResult> {
  const response = await apiClient.get<ListProjectGroupTasksResult>(BASE_PATH)
  return response.data
}

export async function getMyProjectGroupTask(taskId: string): Promise<GetProjectGroupTaskResult> {
  const trimmed = taskId.trim()
  if (!trimmed) {
    throw new Error("taskId is required")
  }

  const response = await apiClient.get<GetProjectGroupTaskResult>(
    `${BASE_PATH}/${encodeURIComponent(trimmed)}`
  )
  return response.data
}

export async function updateMyProjectGroupTask(
  taskId: string,
  dto: UpdateProjectGroupTaskDto
): Promise<GetProjectGroupTaskResult> {
  const trimmed = taskId.trim()
  if (!trimmed) {
    throw new Error("taskId is required")
  }

  const response = await apiClient.patch<GetProjectGroupTaskResult>(
    `${BASE_PATH}/${encodeURIComponent(trimmed)}`,
    dto
  )
  return response.data
}

export async function updateMyProjectGroupTaskStatus(
  taskId: string,
  status: ProjectGroupTaskStatus
): Promise<GetProjectGroupTaskResult> {
  const trimmed = taskId.trim()
  if (!trimmed) {
    throw new Error("taskId is required")
  }

  const response = await apiClient.patch<GetProjectGroupTaskResult>(
    `${BASE_PATH}/${encodeURIComponent(trimmed)}/status`,
    { status }
  )
  return response.data
}

export async function updateMyProjectGroupTaskAssignee(
  taskId: string,
  assignedToUserId?: string | null
): Promise<GetProjectGroupTaskResult> {
  const trimmed = taskId.trim()
  if (!trimmed) {
    throw new Error("taskId is required")
  }

  const response = await apiClient.patch<GetProjectGroupTaskResult>(
    `${BASE_PATH}/${encodeURIComponent(trimmed)}/assignee`,
    assignedToUserId ? { assignedToUserId } : {}
  )
  return response.data
}

export async function deleteMyProjectGroupTask(taskId: string): Promise<DeleteProjectGroupTaskResult> {
  const trimmed = taskId.trim()
  if (!trimmed) {
    throw new Error("taskId is required")
  }

  const response = await apiClient.delete<DeleteProjectGroupTaskResult>(
    `${BASE_PATH}/${encodeURIComponent(trimmed)}`
  )
  return response.data
}
