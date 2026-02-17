import { getDashboardRoleSlug } from "@/lib/auth/dashboard-role-paths"
import { getDashboardUser } from "@/lib/auth/mock-session"
import { redirect } from "next/navigation"

export default async function Page() {
  const user = await getDashboardUser()
  const roleSlug = getDashboardRoleSlug(user.role)

  redirect(`/dashboard/${roleSlug}`)
}