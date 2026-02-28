"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  addProjectStudentMember,
  listProjectMembers,
  removeProjectStudentMember,
} from "@/lib/api/project-members"
import type {
  AddProjectMemberDto,
  ProjectMemberMutationResult,
  ProjectMembersResponse,
} from "@/types/project-members"

export function projectMembersKeys() {
  return {
    root: ["projects", "members"] as const,
    list: (projectId: string) => ["projects", "members", projectId] as const,
  }
}

export function useProjectMembers(projectId: string | null) {
  return useQuery<ProjectMembersResponse, Error>({
    queryKey: projectId ? projectMembersKeys().list(projectId) : projectMembersKeys().root,
    queryFn: async () => {
      if (!projectId) {
        throw new Error("projectId is required")
      }
      return listProjectMembers(projectId)
    },
    enabled: Boolean(projectId),
  })
}

export function useAddProjectStudentMember(projectId: string | null) {
  const queryClient = useQueryClient()

  return useMutation<ProjectMemberMutationResult, Error, AddProjectMemberDto>({
    mutationFn: async (dto) => {
      if (!projectId) {
        throw new Error("projectId is required")
      }
      return addProjectStudentMember(projectId, dto)
    },
    onSuccess: async () => {
      if (projectId) {
        await queryClient.invalidateQueries({ queryKey: projectMembersKeys().list(projectId) })
      }
    },
  })
}

export function useRemoveProjectStudentMember(projectId: string | null) {
  const queryClient = useQueryClient()

  return useMutation<ProjectMemberMutationResult, Error, { userId: string }>({
    mutationFn: async ({ userId }) => {
      if (!projectId) {
        throw new Error("projectId is required")
      }
      return removeProjectStudentMember(projectId, userId)
    },
    onSuccess: async () => {
      if (projectId) {
        await queryClient.invalidateQueries({ queryKey: projectMembersKeys().list(projectId) })
      }
    },
  })
}
