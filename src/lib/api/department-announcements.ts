import apiClient from "@/lib/api/client"
import type { DepartmentAnnouncementsListData } from "@/types/department-announcements"

export async function listDepartmentAnnouncements(
  departmentId: string,
  params: { page?: number; limit?: number } = {}
): Promise<DepartmentAnnouncementsListData> {
  const trimmedDepartmentId = departmentId.trim()
  if (!trimmedDepartmentId) {
    throw new Error("departmentId is required")
  }

  const page = params.page ?? 1
  const limit = params.limit ?? 20

  const response = await apiClient.get<DepartmentAnnouncementsListData>(
    `/departments/${encodeURIComponent(trimmedDepartmentId)}/announcements`,
    {
      params: {
        page,
        limit,
      },
    }
  )

  return response.data
}
