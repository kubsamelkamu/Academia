import { getRoleFromDashboardSlug } from "@/lib/auth/dashboard-role-paths"
import { FacultyDetailPage } from "@/components/dashboard/department-head/faculty-detail-page"
import { GradeDetailPage } from "@/components/dashboard/department-head/grade-detail-page"
import { ReportDetailPage } from "@/components/dashboard/department-head/report-detail-page"
import { notFound } from "next/navigation"

interface SectionIdPageProps {
  params: Promise<{ role: string; section: string; id: string }>
}

export default async function SectionIdPage({ params }: SectionIdPageProps) {
  const { role: roleSlug, section, id } = await params
  const role = getRoleFromDashboardSlug(roleSlug)

  if (role !== "department_head") {
    notFound()
  }

  if (section === "faculty") {
    return <FacultyDetailPage facultyId={id} />
  }
  if (section === "grades") {
    return <GradeDetailPage gradeId={id} />
  }
  if (section === "reports") {
    return <ReportDetailPage reportId={id} />
  }

  notFound()
}
