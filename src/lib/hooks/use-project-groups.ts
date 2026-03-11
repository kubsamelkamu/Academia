"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { createProjectGroup, getAvailableStudents, getMyProjectGroup } from "@/lib/api/project-groups"
import type {
  AvailableStudentsPage,
  CreateProjectGroupDto,
  ProjectGroup,
  ProjectGroupMe,
} from "@/types/project-groups"

export function projectGroupKeys() {
  return {
    root: ["project-groups"] as const,
    me: () => [...projectGroupKeys().root, "me"] as const,
    availableStudents: (params: { page: number; limit: number; search?: string }) =>
      [...projectGroupKeys().root, "available-students", params] as const,
  }
}

export function useCreateProjectGroup() {
  return useMutation<ProjectGroup, Error, CreateProjectGroupDto>({
    mutationFn: (dto) => createProjectGroup(dto),
  })
}

export function useMyProjectGroup(enabled: boolean) {
  return useQuery<ProjectGroupMe, Error>({
    queryKey: projectGroupKeys().me(),
    queryFn: () => getMyProjectGroup(),
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useAvailableStudents(params: {
  enabled: boolean
  page: number
  limit: number
  search?: string
}) {
  const search = params.search?.trim() ? params.search.trim() : undefined

  return useQuery<AvailableStudentsPage, Error>({
    queryKey: projectGroupKeys().availableStudents({
      page: params.page,
      limit: params.limit,
      ...(search ? { search } : null),
    }),
    queryFn: () =>
      getAvailableStudents({
        page: params.page,
        limit: params.limit,
        search,
      }),
    enabled: params.enabled,
    staleTime: 30_000,
    retry: false,
  })
}
