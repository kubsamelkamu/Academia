import { cookies } from "next/headers"
import { type UserRole } from "@/config/navigation"
import { getRoleFromInput } from "@/lib/auth/dashboard-role-paths"

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

function resolveMockRole(): UserRole {
  const envRole =
    process.env.NEXT_PUBLIC_ACADEMIA_MOCK_ROLE ??
    process.env.ACADEMIA_MOCK_ROLE

  return getRoleFromInput(envRole) ?? fallbackUser.role
}

export async function getDashboardUser(): Promise<DashboardUser> {
  const cookieStore = await cookies()
  const cookieRole = cookieStore.get("academia_role")?.value
  const role = getRoleFromInput(cookieRole) ?? resolveMockRole()

  return {
    ...fallbackUser,
    role,
  }
}
