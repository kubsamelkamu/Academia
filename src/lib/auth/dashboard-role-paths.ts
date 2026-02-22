import { type UserRole } from "@/config/navigation"

const roleSlugMap: Record<UserRole, string> = {
  department_head: "department-head",
  coordinator: "coordinator",
  advisor: "advisor",
  student: "student",
  department_committee: "department-committee",
}

const slugRoleMap: Record<string, UserRole> = {
  "department-head": "department_head",
  departmenthead: "department_head",
  depthead: "department_head",
  coordinator: "coordinator",
  coodrinator: "coordinator",
  advisor: "advisor",
  student: "student",
  "department-committee": "department_committee",
  departmentcommittee: "department_committee",
  committee: "department_committee",
}

const directRoleMap: Record<string, UserRole> = {
  department_head: "department_head",
  coordinator: "coordinator",
  advisor: "advisor",
  student: "student",
  department_committee: "department_committee",
}

function normalizeRoleInput(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "").replace(/_/g, "-")
}

export function getDashboardRoleSlug(role: UserRole): string {
  return roleSlugMap[role]
}

export function getRoleFromDashboardSlug(slug: string): UserRole | null {
  const normalized = normalizeRoleInput(slug)
  return slugRoleMap[normalized] ?? null
}

export function getRoleFromInput(value: string | undefined): UserRole | null {
  if (!value) {
    return null
  }

  const normalized = normalizeRoleInput(value)
  const byDirect = directRoleMap[normalized.replace(/-/g, "_")]

  if (byDirect) {
    return byDirect
  }

  return slugRoleMap[normalized] ?? null
}

export function getPrimaryRoleFromBackendRoles(roles: string[] | undefined): UserRole | null {
  if (!roles || roles.length === 0) {
    return null
  }

  // Highest-privilege / most appropriate landing dashboard first.
  const priority: UserRole[] = [
    "department_head",
    "coordinator",
    "advisor",
    "department_committee",
    "student",
  ]

  const resolved = new Set<UserRole>()
  for (const raw of roles) {
    const role = getRoleFromInput(raw)
    if (role) {
      resolved.add(role)
    }
  }

  for (const role of priority) {
    if (resolved.has(role)) {
      return role
    }
  }

  return null
}
