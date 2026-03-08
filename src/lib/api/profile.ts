import apiClient from "@/lib/api/client"
import type { AuthUser } from "@/types/auth"

export interface UpdateProfileNameDto {
  firstName: string
  lastName: string
}

export interface ChangePasswordDto {
  oldPassword?: string
  currentPassword?: string
  newPassword: string
}

export interface UpdateStudentProfileDto {
  bio?: string | null
  githubUrl?: string | null
  linkedinUrl?: string | null
  portfolioUrl?: string | null
  /** Preferred field name (matches backend docs). */
  techStack?: string[]
  /** Backward-compatible alias (some backends/older UI use this). */
  technologies?: string[]
}

export type StudentPublicProfile = {
  user: Partial<AuthUser>
  profile: {
    bio: string | null
    githubUrl: string | null
    linkedinUrl: string | null
    portfolioUrl: string | null
    techStack: string[]
    technologies?: string[]
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function normalizeProfilePayload(payload: unknown): Partial<AuthUser> {
  if (!isRecord(payload)) return {}

  if ("user" in payload && isRecord(payload.user)) {
    return payload.user as Partial<AuthUser>
  }

  return payload as Partial<AuthUser>
}

function normalizeStudentProfilePayload(payload: unknown): Partial<AuthUser> {
  if (!isRecord(payload)) return {}

  const baseUser: Record<string, unknown> =
    "user" in payload && isRecord(payload.user)
      ? payload.user
      : payload

  const profile: Record<string, unknown> =
    "profile" in payload && isRecord(payload.profile)
      ? payload.profile
      : {}

  const bio = typeof profile.bio === "string" ? profile.bio : (profile.bio as null) ?? undefined
  const githubUrl = typeof profile.githubUrl === "string" ? profile.githubUrl : (profile.githubUrl as null) ?? undefined
  const linkedinUrl = typeof profile.linkedinUrl === "string" ? profile.linkedinUrl : (profile.linkedinUrl as null) ?? undefined
  const portfolioUrl = typeof profile.portfolioUrl === "string" ? profile.portfolioUrl : (profile.portfolioUrl as null) ?? undefined

  const techStack =
    (Array.isArray(profile.techStack) ? (profile.techStack as unknown[]).filter((v): v is string => typeof v === "string") : undefined) ??
    (Array.isArray(profile.technologies) ? (profile.technologies as unknown[]).filter((v): v is string => typeof v === "string") : undefined)

  return {
    ...(baseUser as Partial<AuthUser>),
    ...(bio !== undefined ? { bio } : null),
    ...(githubUrl !== undefined ? { githubUrl } : null),
    ...(linkedinUrl !== undefined ? { linkedinUrl } : null),
    ...(portfolioUrl !== undefined ? { portfolioUrl } : null),
    ...(techStack !== undefined ? { techStack, technologies: techStack } : null),
  }
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

export async function getStudentProfile(): Promise<Partial<AuthUser>> {
  const response = await apiClient.get<unknown>("/profile/student")
  return normalizeStudentProfilePayload(response.data)
}

export async function changeProfilePassword(dto: ChangePasswordDto): Promise<void> {
  const oldPassword = dto.oldPassword ?? dto.currentPassword
  if (!oldPassword) {
    throw new Error("Current password is required")
  }

  await apiClient.post("/auth/change-password", {
    oldPassword,
    newPassword: dto.newPassword,
  })
}

export async function updateStudentProfile(
  dto: UpdateStudentProfileDto
): Promise<Partial<AuthUser>> {

  const techStack = dto.techStack ?? dto.technologies
  const payload: Omit<UpdateStudentProfileDto, "technologies"> = {
    bio: dto.bio,
    githubUrl: dto.githubUrl,
    linkedinUrl: dto.linkedinUrl,
    portfolioUrl: dto.portfolioUrl,
    techStack,
  }

  const response = await apiClient.patch<unknown>("/profile/student", payload)
  return normalizeStudentProfilePayload(response.data)
}

export async function getStudentPublicProfile(studentId: string): Promise<StudentPublicProfile> {
  const response = await apiClient.get<unknown>(`/students/${encodeURIComponent(studentId)}/profile`)
  const payload = response.data

  if (!isRecord(payload)) {
    throw new Error("Invalid public profile response")
  }

  const user = ("user" in payload && isRecord(payload.user) ? payload.user : {}) as Partial<AuthUser>
  const profileRaw = ("profile" in payload && isRecord(payload.profile) ? payload.profile : {}) as Record<string, unknown>

  const asNullableString = (value: unknown): string | null => (typeof value === "string" ? value : null)

  const techStack =
    (Array.isArray(profileRaw.techStack)
      ? (profileRaw.techStack as unknown[]).filter((v): v is string => typeof v === "string")
      : undefined) ??
    (Array.isArray(profileRaw.technologies)
      ? (profileRaw.technologies as unknown[]).filter((v): v is string => typeof v === "string")
      : [])

  return {
    user,
    profile: {
      bio: asNullableString(profileRaw.bio),
      githubUrl: asNullableString(profileRaw.githubUrl),
      linkedinUrl: asNullableString(profileRaw.linkedinUrl),
      portfolioUrl: asNullableString(profileRaw.portfolioUrl),
      techStack,
      technologies: techStack,
    },
  }
}
