import apiClient from "@/lib/api/client"
import type {
  CreateDepartmentAnnouncementDto,
  DeleteDepartmentAnnouncementResult,
  DepartmentAnnouncementDetails,
  DepartmentAnnouncementsListData,
  UpdateDepartmentAnnouncementDto,
} from "@/types/department-announcements"

function assertDepartmentId(departmentId: string): string {
  const trimmedDepartmentId = departmentId.trim()
  if (!trimmedDepartmentId) {
    throw new Error("departmentId is required")
  }

  return trimmedDepartmentId
}

function assertAnnouncementId(announcementId: string): string {
  const trimmedAnnouncementId = announcementId.trim()
  if (!trimmedAnnouncementId) {
    throw new Error("announcementId is required")
  }

  return trimmedAnnouncementId
}

export async function listDepartmentAnnouncements(
  departmentId: string,
  params: { page?: number; limit?: number } = {}
): Promise<DepartmentAnnouncementsListData> {
  const trimmedDepartmentId = assertDepartmentId(departmentId)

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

export async function getDepartmentAnnouncementById(
  departmentId: string,
  announcementId: string
): Promise<DepartmentAnnouncementDetails> {
  const trimmedDepartmentId = assertDepartmentId(departmentId)
  const trimmedAnnouncementId = assertAnnouncementId(announcementId)

  const response = await apiClient.get<DepartmentAnnouncementDetails>(
    `/departments/${encodeURIComponent(trimmedDepartmentId)}/announcements/${encodeURIComponent(trimmedAnnouncementId)}`
  )

  return response.data
}

export async function createDepartmentAnnouncement(
  departmentId: string,
  dto: CreateDepartmentAnnouncementDto
): Promise<DepartmentAnnouncementDetails> {
  const trimmedDepartmentId = assertDepartmentId(departmentId)

  const response = await apiClient.post<DepartmentAnnouncementDetails>(
    `/departments/${encodeURIComponent(trimmedDepartmentId)}/announcements`,
    dto
  )

  return response.data
}

export async function updateDepartmentAnnouncement(
  departmentId: string,
  announcementId: string,
  dto: UpdateDepartmentAnnouncementDto
): Promise<DepartmentAnnouncementDetails> {
  const trimmedDepartmentId = assertDepartmentId(departmentId)
  const trimmedAnnouncementId = assertAnnouncementId(announcementId)

  const response = await apiClient.patch<DepartmentAnnouncementDetails>(
    `/departments/${encodeURIComponent(trimmedDepartmentId)}/announcements/${encodeURIComponent(trimmedAnnouncementId)}`,
    dto
  )

  return response.data
}

export async function deleteDepartmentAnnouncement(
  departmentId: string,
  announcementId: string
): Promise<DeleteDepartmentAnnouncementResult> {
  const trimmedDepartmentId = assertDepartmentId(departmentId)
  const trimmedAnnouncementId = assertAnnouncementId(announcementId)

  const response = await apiClient.delete<DeleteDepartmentAnnouncementResult>(
    `/departments/${encodeURIComponent(trimmedDepartmentId)}/announcements/${encodeURIComponent(trimmedAnnouncementId)}`
  )

  return response.data
}
