export interface ProjectAdvisor {
  id: string
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  avatarUrl?: string | null
}

export interface ProjectDetails {
  id: string
  title: string
  status: string
  advisorId?: string | null
  advisor?: ProjectAdvisor | null
  createdAt?: string
  updatedAt?: string
}
