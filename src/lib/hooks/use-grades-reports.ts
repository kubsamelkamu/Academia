import { useQuery } from "@tanstack/react-query"

import {
  getGradesOverview,
  getGradesProjects,
  getGradesStudents,
} from "@/lib/api/grades-reports"
import type {
  GradesOverviewParams,
  GradesOverviewResponse,
  GradesProjectAnalyticsParams,
  GradesProjectAnalyticsResponse,
  GradesStudentAnalyticsParams,
  GradesStudentAnalyticsResponse,
} from "@/types/grades-reports"

export function gradesReportsKeys() {
  return {
    root: ["grades-reports"] as const,
    overview: (params: GradesOverviewParams) =>
      [...gradesReportsKeys().root, "overview", params.stage, params.departmentId ?? "self"] as const,
    projects: (params: GradesProjectAnalyticsParams) =>
      [
        ...gradesReportsKeys().root,
        "projects",
        params.stage,
        params.departmentId ?? "self",
        params.search ?? "",
        params.projectStatus ?? "all",
        params.aggregationStatus ?? "all",
        params.finalizationStatus ?? "all",
        params.page ?? 1,
        params.limit ?? 20,
      ] as const,
    students: (params: GradesStudentAnalyticsParams) =>
      [
        ...gradesReportsKeys().root,
        "students",
        params.stage,
        params.departmentId ?? "self",
        params.search ?? "",
        params.finalizationStatus ?? "all",
        params.letterGrade ?? "all",
        String(params.minFinalGrade ?? ""),
        String(params.maxFinalGrade ?? ""),
        params.page ?? 1,
        params.limit ?? 20,
      ] as const,
  }
}

export function useGradesOverview(params: GradesOverviewParams & { enabled?: boolean }) {
  const enabled = params.enabled ?? true

  return useQuery<GradesOverviewResponse, Error>({
    queryKey: enabled ? gradesReportsKeys().overview(params) : gradesReportsKeys().root,
    queryFn: () => getGradesOverview(params),
    enabled,
    staleTime: 30_000,
    retry: 1,
  })
}

export function useGradesProjects(params: GradesProjectAnalyticsParams & { enabled?: boolean }) {
  const enabled = params.enabled ?? true

  return useQuery<GradesProjectAnalyticsResponse, Error>({
    queryKey: enabled ? gradesReportsKeys().projects(params) : gradesReportsKeys().root,
    queryFn: () => getGradesProjects(params),
    enabled,
    staleTime: 30_000,
    retry: 1,
    placeholderData: (previousData) => previousData,
  })
}

export function useGradesStudents(params: GradesStudentAnalyticsParams & { enabled?: boolean }) {
  const enabled = params.enabled ?? true

  return useQuery<GradesStudentAnalyticsResponse, Error>({
    queryKey: enabled ? gradesReportsKeys().students(params) : gradesReportsKeys().root,
    queryFn: () => getGradesStudents(params),
    enabled,
    staleTime: 30_000,
    retry: 1,
    placeholderData: (previousData) => previousData,
  })
}