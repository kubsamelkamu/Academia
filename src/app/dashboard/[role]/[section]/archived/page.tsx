import { getRoleFromDashboardSlug } from "@/lib/auth/dashboard-role-paths"
import { ProjectsArchivedPage } from "@/components/dashboard/department-head/projects-archived-page"
import { notFound } from "next/navigation"

interface SectionArchivedPageProps {
  params: Promise<{ role: string; section: string }>
}

export default async function SectionArchivedPage({ params }: SectionArchivedPageProps) {
  const { role: roleSlug, section } = await params
  const role = getRoleFromDashboardSlug(roleSlug)

  if (role !== "department_head" || section !== "projects") {
    notFound()
  }

  return <ProjectsArchivedPage />
}
