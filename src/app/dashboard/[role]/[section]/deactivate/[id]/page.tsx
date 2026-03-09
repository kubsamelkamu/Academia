import { getRoleFromDashboardSlug } from "@/lib/auth/dashboard-role-paths"
import { FacultyDeactivatePage } from "@/components/dashboard/department-head/faculty-deactivate-page"
import { notFound } from "next/navigation"

interface FacultyDeactivateIdPageProps {
  params: Promise<{ role: string; section: string; id: string }>
}

export default async function FacultyDeactivateIdPage({ params }: FacultyDeactivateIdPageProps) {
  const { role: roleSlug, section, id } = await params
  const role = getRoleFromDashboardSlug(roleSlug)

  if (role !== "department_head" || section !== "faculty") {
    notFound()
  }

  return <FacultyDeactivatePage facultyId={id} />
}
