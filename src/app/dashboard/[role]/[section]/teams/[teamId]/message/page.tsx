import { getRoleFromDashboardSlug } from "@/lib/auth/dashboard-role-paths"
import { notFound } from "next/navigation"
import { ProjectsTeamMessagePage } from "@/components/dashboard/department-head/projects-team-message-page"

interface TeamMessagePageProps {
  params: Promise<{ role: string; section: string; teamId: string }>
}

export default async function TeamMessagePage({ params }: TeamMessagePageProps) {
  const { role: roleSlug, section } = await params
  const role = getRoleFromDashboardSlug(roleSlug)

  if (role !== "department_head" || section !== "projects") {
    notFound()
  }

  return <ProjectsTeamMessagePage />
}

