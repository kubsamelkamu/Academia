import apiClient from '@/lib/api/client'
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

function cleanParams(params: Record<string, string | number | undefined>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
  )
}

export async function getCoordinatorAdvisorOverview(
  params: CoordinatorAdvisorOverviewParams
): Promise<CoordinatorAdvisorOverviewResponse> {
  const response = await apiClient.get<CoordinatorAdvisorOverviewResponse>(
    '/analytics/advisors/overview',
    {
      params: cleanParams({
        departmentId: params.departmentId,
        page: params.page,
        limit: params.limit,
        search: params.search,
        projectStatus: params.projectStatus,
        startDate: params.startDate,
        endDate: params.endDate,
      }),
    }
  )

  return response.data
}

export async function getCoordinatorStudentDirectory(
  params: CoordinatorStudentDirectoryParams
): Promise<CoordinatorStudentDirectoryResponse> {
  const response = await apiClient.get<CoordinatorStudentDirectoryResponse>(
    '/analytics/students/directory',
    {
      params: cleanParams({
        departmentId: params.departmentId,
        search: params.search,
        userStatus: params.userStatus,
        groupStatus: params.groupStatus,
        hasGroup: params.hasGroup,
        page: params.page,
        limit: params.limit,
      }),
    }
  )

  return response.data
}

export async function getCoordinatorProjectTracking(
  params: CoordinatorProjectTrackingParams
): Promise<CoordinatorProjectTrackingResponse> {
  const response = await apiClient.get<CoordinatorProjectTrackingResponse>(
    '/analytics/projects/tracking',
    {
      params: cleanParams({
        departmentId: params.departmentId,
        search: params.search,
        projectStatus: params.projectStatus,
        page: params.page,
        limit: params.limit,
      }),
    }
  )

  return response.data
}