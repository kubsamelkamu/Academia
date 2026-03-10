import { getRoleFromDashboardSlug } from "@/lib/auth/dashboard-role-paths"
import { FacultyDetailPage } from "@/components/dashboard/department-head/faculty-detail-page"
import { GradeDetailPage } from "@/components/dashboard/department-head/grade-detail-page"
import { ReportDetailPage } from "@/components/dashboard/department-head/report-detail-page"
import { GroupManagerApplicationDetailPage } from "@/components/dashboard/department-head/group-manager-application-detail-page"
import { DepartmentHeadStudentDetailPage } from "@/components/dashboard/department-head/student-detail-page"
import { GroupDetailPage } from "@/components/dashboard/department-head/group-detail-page"
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
    if (id.startsWith("ga")) {
      return <GroupManagerApplicationDetailPage applicationId={id} />
    }

    if (id.startsWith("student-")) {
      const studentId = id.replace("student-", "")
      return <DepartmentHeadStudentDetailPage studentId={studentId} />
    }

    if (id.startsWith("group-")) {
      const groupId = id.replace("group-", "")
      return <GroupDetailPage groupId={groupId} />
    }

    return <GradeDetailPage gradeId={id} />
  }

  if (section === "reports") {
    return <ReportDetailPage reportId={id} />
  }

  notFound()
}
