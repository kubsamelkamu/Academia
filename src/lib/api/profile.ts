import apiClient from "@/lib/api/client"
import type { AuthUser } from "@/types/auth"

export interface UpdateProfileNameDto {
  firstName: string
  lastName: string
}

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

/**
 * Backend implementations vary: some endpoints return the updated user directly,
 * others may wrap it in `{ user: ... }` or return a partial like `{ avatarUrl: ... }`.
 * This normalizer lets the UI/store remain stable.
 */
function normalizeProfilePayload(payload: unknown): Partial<AuthUser> {
  if (!isRecord(payload)) return {}

  if ("user" in payload && isRecord(payload.user)) {
    return payload.user as Partial<AuthUser>
  }

  return payload as Partial<AuthUser>
}

export async function getProfile(): Promise<Partial<AuthUser>> {
  const response = await apiClient.get<unknown>("/profile")
  return normalizeProfilePayload(response.data)
}

export async function updateProfileName(dto: UpdateProfileNameDto): Promise<Partial<AuthUser>> {
  const response = await apiClient.post<unknown>("/profile/update-name", dto)
  return normalizeProfilePayload(response.data)
}

export async function uploadProfileAvatar(file: File): Promise<Partial<AuthUser>> {
  const formData = new FormData()
  // Common convention: backend expects `avatar` field
  formData.append("avatar", file)

  const response = await apiClient.post<unknown>("/profile/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return normalizeProfilePayload(response.data)
}

export async function deleteProfileAvatar(): Promise<Partial<AuthUser>> {
  const response = await apiClient.delete<unknown>("/profile/avatar")
  return normalizeProfilePayload(response.data)
}

export async function changeProfilePassword(dto: ChangePasswordDto): Promise<void> {
  await apiClient.post("/profile/change-password", dto)
}
