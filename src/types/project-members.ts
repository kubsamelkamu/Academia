import type { AuthUser } from "@/types/auth"

export type ProjectMemberRole = "STUDENT" | "ADVISOR" | "COMMITTEE" | "OTHER"

export type ProjectMemberUser = Pick<
  AuthUser,
  "id" | "firstName" | "lastName" | "email" | "avatarUrl" | "status"
>

export interface ProjectMemberRecord {
  userId: string
  role: ProjectMemberRole
  joinedAt: string
  user: ProjectMemberUser
}

export interface ProjectMembersResponse {
  projectId: string
  members: ProjectMemberRecord[]
}

export interface AddProjectMemberDto {
  userId: string
}

export interface ProjectMemberMutationResult {
  projectId: string
  userId: string
  role: ProjectMemberRole
  minGroupSize: number
  maxGroupSize: number
}
