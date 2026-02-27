import apiClient from "@/lib/api/client"
import type { TenantCurrent, UpdateTenantAddressDto } from "@/types/university"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function normalizeTenantCurrentPayload(payload: unknown): TenantCurrent {
  if (!isRecord(payload)) {
    throw new Error("Unexpected response")
  }

  const candidate =
    "tenant" in payload && isRecord(payload.tenant) ? payload.tenant : payload

  return candidate as TenantCurrent
}


export async function getUniversityConfig(): Promise<TenantCurrent> {
  const response = await apiClient.get<TenantCurrent>("/tenant/current")
  return response.data
}

export async function updateUniversityConfig(dto: UpdateTenantAddressDto): Promise<TenantCurrent> {
  const response = await apiClient.patch<TenantCurrent>("/tenant/address", dto)
  return response.data
}

export async function uploadUniversityLogo(file: File): Promise<TenantCurrent> {
  const formData = new FormData()
  formData.append("logo", file)

  const response = await apiClient.post<unknown>("/tenant/logo", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return normalizeTenantCurrentPayload(response.data)
}
