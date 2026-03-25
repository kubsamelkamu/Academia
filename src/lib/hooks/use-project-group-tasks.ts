"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createMyProjectGroupTask,
  deleteMyProjectGroupTask,
  getMyProjectGroupTask,
  listMyProjectGroupTasks,
  updateMyProjectGroupTask,
  updateMyProjectGroupTaskAssignee,
  updateMyProjectGroupTaskStatus,
} from "@/lib/api/project-group-tasks"
import type {
  CreateProjectGroupTaskDto,
  DeleteProjectGroupTaskResult,
  GetProjectGroupTaskResult,
  ListProjectGroupTasksResult,
  ProjectGroupTaskStatus,
  UpdateProjectGroupTaskDto,
} from "@/types/project-group-tasks"

export function projectGroupTaskKeys() {
  return {
    root: ["project-group-tasks"] as const,
    list: () => [...projectGroupTaskKeys().root, "list"] as const,
    detail: (taskId: string) => [...projectGroupTaskKeys().root, "detail", taskId] as const,
  }
}

export function useMyProjectGroupTasks(enabled: boolean) {
  return useQuery<ListProjectGroupTasksResult, Error>({
    queryKey: projectGroupTaskKeys().list(),
    queryFn: () => listMyProjectGroupTasks(),
    enabled,
    staleTime: 10_000,
    retry: false,
  })
}

export function useMyProjectGroupTask(taskId: string | null, enabled: boolean) {
  const trimmed = taskId?.trim() ? taskId.trim() : null

  return useQuery<GetProjectGroupTaskResult, Error>({
    queryKey: projectGroupTaskKeys().detail(trimmed ?? ""),
    queryFn: () => {
      if (!trimmed) {
        throw new Error("taskId is required")
      }
      return getMyProjectGroupTask(trimmed)
    },
    enabled: enabled && Boolean(trimmed),
    staleTime: 10_000,
    retry: false,
  })
}

export function useCreateMyProjectGroupTask() {
  const queryClient = useQueryClient()

  return useMutation<GetProjectGroupTaskResult, Error, CreateProjectGroupTaskDto>({
    mutationFn: async (dto) => {
      const result = await createMyProjectGroupTask(dto)
      return { task: result.task }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectGroupTaskKeys().root })
    },
  })
}

export function useUpdateMyProjectGroupTask(taskId: string) {
  const queryClient = useQueryClient()

  return useMutation<GetProjectGroupTaskResult, Error, UpdateProjectGroupTaskDto>({
    mutationFn: (dto) => updateMyProjectGroupTask(taskId, dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectGroupTaskKeys().root })
    },
  })
}

export function useUpdateMyProjectGroupTaskStatus(taskId: string) {
  const queryClient = useQueryClient()

  return useMutation<GetProjectGroupTaskResult, Error, { status: ProjectGroupTaskStatus }>({
    mutationFn: ({ status }) => updateMyProjectGroupTaskStatus(taskId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectGroupTaskKeys().root })
    },
  })
}

export function useUpdateMyProjectGroupTaskAssignee(taskId: string) {
  const queryClient = useQueryClient()

  return useMutation<GetProjectGroupTaskResult, Error, { assignedToUserId?: string | null }>({
    mutationFn: ({ assignedToUserId }) => updateMyProjectGroupTaskAssignee(taskId, assignedToUserId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectGroupTaskKeys().root })
    },
  })
}

export function useDeleteMyProjectGroupTask() {
  const queryClient = useQueryClient()

  return useMutation<DeleteProjectGroupTaskResult, Error, { taskId: string }>({
    mutationFn: ({ taskId }) => deleteMyProjectGroupTask(taskId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectGroupTaskKeys().root })
    },
  })
}
