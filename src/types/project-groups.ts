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
