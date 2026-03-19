"use client"

import { useQuery } from "@tanstack/react-query"
import {
  listProjectMilestones,
  listStudentProjects,
} from "@/lib/api/student-milestones"
import type {
  StudentProjectMilestonesResult,
  StudentProjectsListResult,
} from "@/types/student-milestones"

export function studentMilestonesKeys() {
  return {
    root: ["student", "milestones"] as const,
    projects: (departmentId: string, studentId: string) =>
      ["student", "milestones", "projects", departmentId, studentId] as const,
    projectMilestones: (projectId: string) =>
      ["student", "milestones", "project", projectId] as const,
  }
}

export function useStudentProjects(params: {
  departmentId: string | null | undefined
  studentId: string | null | undefined
  enabled?: boolean
}) {
  const departmentId = params.departmentId?.trim() ?? ""
  const studentId = params.studentId?.trim() ?? ""
  const enabled = (params.enabled ?? true) && Boolean(departmentId) && Boolean(studentId)

  return useQuery<StudentProjectsListResult, Error>({
    queryKey: enabled
      ? studentMilestonesKeys().projects(departmentId, studentId)
      : studentMilestonesKeys().root,
    queryFn: () => listStudentProjects({ departmentId, studentId }),
    enabled,
    staleTime: 30_000,
  })
}

export function useProjectMilestones(params: {
  projectId: string | null | undefined
  enabled?: boolean
}) {
  const projectId = params.projectId?.trim() ?? ""
  const enabled = (params.enabled ?? true) && Boolean(projectId)

  return useQuery<StudentProjectMilestonesResult, Error>({
    queryKey: enabled
      ? studentMilestonesKeys().projectMilestones(projectId)
      : studentMilestonesKeys().root,
    queryFn: () => listProjectMilestones(projectId),
    enabled,
    staleTime: 30_000,
  })
}
