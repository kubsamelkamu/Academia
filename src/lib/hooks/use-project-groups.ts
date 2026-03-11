"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { createProjectGroup, getMyProjectGroup } from "@/lib/api/project-groups"
import type { CreateProjectGroupDto, ProjectGroup, ProjectGroupMe } from "@/types/project-groups"

export function projectGroupKeys() {
  return {
    root: ["project-groups"] as const,
    me: () => [...projectGroupKeys().root, "me"] as const,
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
