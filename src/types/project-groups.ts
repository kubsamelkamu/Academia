export interface CreateProjectGroupDto {
  name: string
  objectives: string
  technologies: string[]
}

export interface ProjectGroup {
  id: string
  tenantId?: string
  departmentId?: string
  leaderUserId?: string
  name: string
  objectives: string
  technologies: string[]
  createdAt?: string
  updatedAt?: string
}

export interface ProjectGroupLeader {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
}

export interface ProjectGroupMemberUser {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
}

export interface ProjectGroupMember {
  id: string
  joinedAt: string
  user: ProjectGroupMemberUser
}

export interface ProjectGroupMe {
  id: string
  tenantId: string
  departmentId: string
  leaderUserId: string
  name: string
  objectives: string
  technologies: string[]
  createdAt: string
  updatedAt: string
  leader: ProjectGroupLeader
  members: ProjectGroupMember[]
  pendingInvitationsCount: number
}

export type AvailableStudentProfile = {
  bio: string | null
  githubUrl: string | null
  linkedinUrl: string | null
  portfolioUrl: string | null
  techStack: string[]
}

export type AvailableStudentUser = {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  departmentId: string | null
}

export type AvailableStudentListItem = {
  user: AvailableStudentUser
  profile: AvailableStudentProfile
}

export type AvailableStudentsPagination = {
  total: number
  page: number
  limit: number
  pages: number
}

export type AvailableStudentsPage = {
  items: AvailableStudentListItem[]
  pagination: AvailableStudentsPagination
}

export type CreateProjectGroupInvitationDto = {
  invitedUserId: string
}

export type ProjectGroupInvitation = {
  id: string
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | string
  expiresAt: string
}

export type CreateProjectGroupInvitationResult = {
  invitation: ProjectGroupInvitation
  /** Some backends return an informational message like "Invitation already sent". */
  message?: string
}
