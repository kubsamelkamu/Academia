export type TenantUserRoleName =
  | "DEPARTMENT_HEAD"
  | "COORDINATOR"
  | "ADVISOR"
  | "STUDENT"
  | string

export interface Pagination {
  total: number
  page: number
  limit: number
  pages: number
}

export type TenantUserRoleRecord = {
  role: {
    name: TenantUserRoleName
  }
}

export type TenantUserListItem = {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  avatarUrl?: string | null
  status?: string | null
  emailVerified?: boolean | null
  lastLoginAt?: string | null
  createdAt?: string | null
  roles?: TenantUserRoleRecord[]
}

export type TenantUsersPagedData = {
  users: TenantUserListItem[]
  pagination: Pagination
}

export type TenantUserDetail = TenantUserListItem & {
  tenantId?: string
  departmentId?: string | null
  departmentName?: string | null
}

export type UpdateTenantUserDto = Partial<{
  firstName: string
  lastName: string
  email: string
}>

export type TenantUserStatusChange = {
  id: string
  status: "ACTIVE" | "INACTIVE" | string
  deletedAt?: string | null
}

export type ListTenantUsersPagedParams = {
  search?: string
  roleNames?: TenantUserRoleName[]
  page?: number
  limit?: number
}
