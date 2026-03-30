"use client"

import { useQuery } from "@tanstack/react-query"
import { getProjectById } from "@/lib/api/projects"
import type { ProjectDetails } from "@/types/projects"

export function projectKeys() {
  return {
    root: ["projects"] as const,
    detail: (projectId: string) => ["projects", "detail", projectId] as const,
  }
}

export function useProject(projectId: string | null | undefined, enabled = true) {
  const trimmed = projectId?.trim() ?? ""
  const isEnabled = enabled && Boolean(trimmed)

  return useQuery<ProjectDetails, Error>({
    queryKey: isEnabled ? projectKeys().detail(trimmed) : projectKeys().root,
    queryFn: () => getProjectById(trimmed),
    enabled: isEnabled,
    staleTime: 30_000,
  })
}
