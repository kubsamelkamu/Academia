import apiClient from "@/lib/api/client"
import type {
  DepartmentGroupSizeSettings,
  UpdateDepartmentGroupSizeSettingsDto,
} from "@/types/department-settings"

export async function getDepartmentGroupSizeSettings(): Promise<DepartmentGroupSizeSettings> {
  const response = await apiClient.get<DepartmentGroupSizeSettings>(
    "/department/settings/group-size"
  )
  return response.data
}

export async function updateDepartmentGroupSizeSettings(
  dto: UpdateDepartmentGroupSizeSettingsDto
): Promise<DepartmentGroupSizeSettings> {
  const response = await apiClient.put<DepartmentGroupSizeSettings>(
    "/department/settings/group-size",
    dto
  )
  return response.data
}
