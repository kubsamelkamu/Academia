export type ProjectGroupTaskStatus = "TODO" | "IN_PROGRESS" | "DONE"

export type CreateProjectGroupTaskDto = {
  title: string
  description?: string | null
  /** ISO string (date-only in UI; backend expects ISO). */
  dueDate?: string | null
  assignedToUserId?: string | null
}

export type UpdateProjectGroupTaskDto = {
  title?: string
  description?: string | null
  dueDate?: string | null
}

export type UpdateProjectGroupTaskStatusDto = {
  status: ProjectGroupTaskStatus
}

export type UpdateProjectGroupTaskAssigneeDto = {
  assignedToUserId?: string | null
}

export type ProjectGroupTaskListItem = {
  id: string
  title: string
  description?: string | null
  status: ProjectGroupTaskStatus
  assignedToUserId: string | null
  createdByUserId: string
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

export type ProjectGroupTaskDetail = ProjectGroupTaskListItem & {
  projectGroupId?: string
  description?: string | null
}

export type CreateProjectGroupTaskResult = {
  task: ProjectGroupTaskDetail
}

export type ListProjectGroupTasksResult = {
  items: ProjectGroupTaskListItem[]
}

export type GetProjectGroupTaskResult = {
  task: ProjectGroupTaskDetail
}

export type DeleteProjectGroupTaskResult = {
  deleted: boolean
}
