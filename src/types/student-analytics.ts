export interface CoordinatorStudentDirectoryParams {
  departmentId: string
  search?: string
  userStatus?: string
  groupStatus?: string
  hasGroup?: boolean
  page?: number
  limit?: number
}

export interface CoordinatorStudentDirectorySummary {
  totalStudents: number
  totalProjectGroups: number
  approvedProjectGroups: number
  rejectedProjectGroups: number
}

export interface CoordinatorStudentDirectoryPagination {
  total: number
  page: number
  limit: number
  pages: number
}

export interface CoordinatorStudentDirectoryStudent {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
  userStatus: string
  lastLoginAt: string | null
}

export interface CoordinatorStudentDirectoryProfile {
  bio: string | null
  githubUrl: string | null
  linkedinUrl: string | null
  portfolioUrl: string | null
  techStack: string[]
}

export interface CoordinatorStudentDirectoryGroup {
  hasGroup: boolean
  role: string | null
  id: string | null
  name: string | null
  status: string | null
}

export interface CoordinatorStudentDirectoryItem {
  student: CoordinatorStudentDirectoryStudent
  profile: CoordinatorStudentDirectoryProfile
  group: CoordinatorStudentDirectoryGroup
}

export interface CoordinatorStudentDirectoryResponse {
  summary: CoordinatorStudentDirectorySummary
  items: CoordinatorStudentDirectoryItem[]
  pagination: CoordinatorStudentDirectoryPagination
}