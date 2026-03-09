import { getRoleFromDashboardSlug } from "@/lib/auth/dashboard-role-paths"
import { notFound } from "next/navigation"
import { ProjectsTeamMemberDetailPage } from "@/components/dashboard/department-head/projects-team-member-detail-page"

interface MemberDetailPageProps {
  params: Promise<{ role: string; section: string; teamId: string; memberId: string }>
}

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { role: roleSlug, section } = await params
  const role = getRoleFromDashboardSlug(roleSlug)

  if (role !== "department_head" || section !== "projects") {
    notFound()
  }

  return <ProjectsTeamMemberDetailPage />
}

