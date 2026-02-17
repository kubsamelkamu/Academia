import DashboardPage from "@/components/dashboard/page"
import {
  getDashboardRoleSlug,
  getRoleFromDashboardSlug,
} from "@/lib/auth/dashboard-role-paths"
import { notFound, redirect } from "next/navigation"

interface RoleDashboardPageProps {
  params: Promise<{
    role: string
  }>
}

export default async function RoleDashboardPage({ params }: RoleDashboardPageProps) {
  const { role: roleSlugInput } = await params
  const role = getRoleFromDashboardSlug(roleSlugInput)

  if (!role) {
    notFound()
  }

  const canonicalSlug = getDashboardRoleSlug(role)

  if (roleSlugInput.toLowerCase() !== canonicalSlug) {
    redirect(`/dashboard/${canonicalSlug}`)
  }

  return <DashboardPage role={role} />
}
