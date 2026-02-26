import apiClient from "@/lib/api/client"
import type { TenantCurrent, UpdateTenantAddressDto } from "@/types/university"


export async function getUniversityConfig(): Promise<TenantCurrent> {
  const response = await apiClient.get<TenantCurrent>("/tenant/current")
  return response.data
}

export async function updateUniversityConfig(dto: UpdateTenantAddressDto): Promise<TenantCurrent> {
  const response = await apiClient.patch<TenantCurrent>("/tenant/address", dto)
  return response.data
}
