import { useQuery } from '@tanstack/react-query'
import {
  getCoordinatorAdvisorOverview,
  getCoordinatorProjectTracking,
  getCoordinatorStudentDirectory,
} from '@/lib/api/coordinator-analytics'
import type {
  CoordinatorAdvisorOverviewParams,
  CoordinatorAdvisorOverviewResponse,
} from '@/types/advisor-analytics'
import type {
  CoordinatorStudentDirectoryParams,
  CoordinatorStudentDirectoryResponse,
} from '@/types/student-analytics'
import type {
  CoordinatorProjectTrackingParams,
  CoordinatorProjectTrackingResponse,
} from '@/types/project-tracking'

export function coordinatorAnalyticsKeys() {
  return {
    root: ['coordinator-analytics'] as const,
    advisorOverview: (params: CoordinatorAdvisorOverviewParams) =>
      [
        ...coordinatorAnalyticsKeys().root,
        'advisor-overview',
        params.departmentId,
        params.page ?? 1,
        params.limit ?? 100,
        params.search ?? '',
        params.projectStatus ?? 'all',
        params.startDate ?? '',
        params.endDate ?? '',
      ] as const,
    studentDirectory: (params: CoordinatorStudentDirectoryParams) =>
      [
        ...coordinatorAnalyticsKeys().root,
        'student-directory',
        params.departmentId,
        params.page ?? 1,
        params.limit ?? 20,
        params.search ?? '',
        params.userStatus ?? 'all',
        params.groupStatus ?? 'all',
        String(params.hasGroup ?? ''),
      ] as const,
    projectTracking: (params: CoordinatorProjectTrackingParams) =>
      [
        ...coordinatorAnalyticsKeys().root,
        'project-tracking',
        params.departmentId,
        params.page ?? 1,
        params.limit ?? 20,
        params.search ?? '',
        params.projectStatus ?? 'all',
      ] as const,
  }
}

export function useCoordinatorAdvisorOverview(params: {
  departmentId: string | null | undefined
  page?: number
  limit?: number
  search?: string
  projectStatus?: CoordinatorAdvisorOverviewParams['projectStatus']
  startDate?: string
  endDate?: string
  enabled?: boolean
}) {
  const departmentId = params.departmentId?.trim() ? params.departmentId.trim() : null
  const enabled = (params.enabled ?? true) && Boolean(departmentId)

  return useQuery<CoordinatorAdvisorOverviewResponse, Error>({
    queryKey: enabled
      ? coordinatorAnalyticsKeys().advisorOverview({
          departmentId: departmentId ?? '',
          page: params.page,
          limit: params.limit,
          search: params.search,
          projectStatus: params.projectStatus,
          startDate: params.startDate,
          endDate: params.endDate,
        })
      : coordinatorAnalyticsKeys().root,
    queryFn: () => {
      if (!departmentId) {
        throw new Error('departmentId is required')
      }

      return getCoordinatorAdvisorOverview({
        departmentId,
        page: params.page,
        limit: params.limit,
        search: params.search,
        projectStatus: params.projectStatus,
        startDate: params.startDate,
        endDate: params.endDate,
      })
    },
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useCoordinatorStudentDirectory(params: {
  departmentId: string | null | undefined
  search?: string
  userStatus?: string
  groupStatus?: string
  hasGroup?: boolean
  page?: number
  limit?: number
  enabled?: boolean
}) {
  const departmentId = params.departmentId?.trim() ? params.departmentId.trim() : null
  const enabled = (params.enabled ?? true) && Boolean(departmentId)

  return useQuery<CoordinatorStudentDirectoryResponse, Error>({
    queryKey: enabled
      ? coordinatorAnalyticsKeys().studentDirectory({
          departmentId: departmentId ?? '',
          search: params.search,
          userStatus: params.userStatus,
          groupStatus: params.groupStatus,
          hasGroup: params.hasGroup,
          page: params.page,
          limit: params.limit,
        })
      : coordinatorAnalyticsKeys().root,
    queryFn: () => {
      if (!departmentId) {
        throw new Error('departmentId is required')
      }

      return getCoordinatorStudentDirectory({
        departmentId,
        search: params.search,
        userStatus: params.userStatus,
        groupStatus: params.groupStatus,
        hasGroup: params.hasGroup,
        page: params.page,
        limit: params.limit,
      })
    },
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useCoordinatorProjectTracking(params: {
  departmentId: string | null | undefined
  search?: string
  projectStatus?: string
  page?: number
  limit?: number
  enabled?: boolean
}) {
  const departmentId = params.departmentId?.trim() ? params.departmentId.trim() : null
  const enabled = (params.enabled ?? true) && Boolean(departmentId)

  return useQuery<CoordinatorProjectTrackingResponse, Error>({
    queryKey: enabled
      ? coordinatorAnalyticsKeys().projectTracking({
          departmentId: departmentId ?? '',
          search: params.search,
          projectStatus: params.projectStatus,
          page: params.page,
          limit: params.limit,
        })
      : coordinatorAnalyticsKeys().root,
    queryFn: () => {
      if (!departmentId) {
        throw new Error('departmentId is required')
      }

      return getCoordinatorProjectTracking({
        departmentId,
        search: params.search,
        projectStatus: params.projectStatus,
        page: params.page,
        limit: params.limit,
      })
    },
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}