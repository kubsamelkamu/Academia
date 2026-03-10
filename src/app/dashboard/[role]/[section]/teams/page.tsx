import { getRoleFromDashboardSlug } from "@/lib/auth/dashboard-role-paths"
import { notFound } from "next/navigation"
import { ProjectsTeamsPage } from "@/components/dashboard/department-head/projects-teams-page"

interface SectionTeamsPageProps {
  params: Promise<{ role: string; section: string }>
}

export default async function SectionTeamsPage({ params }: SectionTeamsPageProps) {
  const { role: roleSlug, section } = await params
  const role = getRoleFromDashboardSlug(roleSlug)

  if (role !== "department_head" || section !== "projects") {
    notFound()
  }

  return <ProjectsTeamsPage />
}

