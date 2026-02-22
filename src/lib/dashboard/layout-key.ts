import { type UserRole } from "@/config/navigation"

export function getDashboardLayoutKey(input: {
  tenantDomain?: string
  userId: string
  role: UserRole
}): string {
  const tenant = (input.tenantDomain || "default").trim().toLowerCase()
  return `dashboard:${tenant}:${input.userId}:${input.role}`
}
