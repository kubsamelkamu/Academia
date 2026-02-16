import { cookies } from "next/headers"
import { type UserRole } from "@/config/navigation"

export interface DashboardUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}

const fallbackUser: DashboardUser = {
  id: "1",
  name: "Department Head",
  email: "head@university.edu",
  role: "department_head",
  avatar: undefined,
}

const validRoles: UserRole[] = [
  "department_head",
  "coordinator",
  "advisor",
  "student",
  "department_committee",
]

function isUserRole(value: string | undefined): value is UserRole {
  if (!value) {
    return false
  }

  return validRoles.includes(value as UserRole)
}

function resolveMockRole(): UserRole {
  const envRole =
    process.env.NEXT_PUBLIC_ACADEMIA_MOCK_ROLE ??
    process.env.ACADEMIA_MOCK_ROLE

  return isUserRole(envRole) ? envRole : fallbackUser.role
}

export async function getDashboardUser(): Promise<DashboardUser> {
  const cookieStore = await cookies()
  const cookieRole = cookieStore.get("academia_role")?.value
  const role = isUserRole(cookieRole) ? cookieRole : resolveMockRole()

  return {
    ...fallbackUser,
    role,
  }
}
