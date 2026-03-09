import { getRoleFromDashboardSlug } from "@/lib/auth/dashboard-role-paths"
import { ProjectsActivePage } from "@/components/dashboard/department-head/projects-active-page"
import { notFound } from "next/navigation"

interface SectionActivePageProps {
  params: Promise<{ role: string; section: string }>
}

export default async function SectionActivePage({ params }: SectionActivePageProps) {
  const { role: roleSlug, section } = await params
  const role = getRoleFromDashboardSlug(roleSlug)

  if (role !== "department_head" || section !== "projects") {
    notFound()
  }

  return <ProjectsActivePage />
}
