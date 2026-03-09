import { getRoleFromDashboardSlug } from "@/lib/auth/dashboard-role-paths"
import { notFound } from "next/navigation"
import { ProjectsTeamDetailPage } from "@/components/dashboard/department-head/projects-team-detail-page"

interface TeamDetailPageProps {
  params: Promise<{ role: string; section: string; teamId: string }>
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { role: roleSlug, section } = await params
  const role = getRoleFromDashboardSlug(roleSlug)

  if (role !== "department_head" || section !== "projects") {
    notFound()
  }

  return <ProjectsTeamDetailPage />
}

