import { getDashboardRoleSlug } from "@/lib/auth/dashboard-role-paths"
import { getDashboardUser } from "@/lib/auth/mock-session"
import { redirect } from "next/navigation"

function resolveDefensePathByRole(role: Awaited<ReturnType<typeof getDashboardUser>>["role"]): string {
  const slug = getDashboardRoleSlug(role)

  if (role === "student") {
    return `/dashboard/${slug}/defense`
  }

  if (role === "coordinator") {
    return `/dashboard/${slug}/defenses`
  }

  if (role === "department_committee") {
    return `/dashboard/${slug}/defense-schedule`
  }

  return `/dashboard/${slug}`
}

export default async function DefenseFallbackPage() {
  const user = await getDashboardUser()

  redirect(resolveDefensePathByRole(user.role))
}
