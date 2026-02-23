import apiClient from "@/lib/api/client"
import type { AuthMeUser } from "@/types/auth"

export async function getAuthMe(): Promise<AuthMeUser> {
  const response = await apiClient.get<AuthMeUser>("/auth/me")
  return response.data
}
