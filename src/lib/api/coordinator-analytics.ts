import apiClient from '@/lib/api/client'
import type {
  CoordinatorAdvisorOverviewParams,
  CoordinatorAdvisorOverviewResponse,
} from '@/types/advisor-analytics'

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