import { getRoleFromDashboardSlug } from "@/lib/auth/dashboard-role-paths"
import { FacultyEditPage } from "@/components/dashboard/department-head/faculty-edit-page"
import { AnnouncementEditPage } from "@/components/dashboard/department-head/announcements-edit-page"
import { notFound } from "next/navigation"

interface EditIdPageProps {
  params: Promise<{ role: string; section: string; id: string }>
}

export default async function EditIdPage({ params }: EditIdPageProps) {
  const { role: roleSlug, section, id } = await params
  const role = getRoleFromDashboardSlug(roleSlug)

  if (role !== "department_head") {
    notFound()
  }

  if (section === "faculty") {
    return <FacultyEditPage facultyId={id} />
  }

  if (section === "announcements") {
    return <AnnouncementEditPage announcementId={id} />
  }

  notFound()
}
