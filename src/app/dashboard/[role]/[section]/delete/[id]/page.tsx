import { getRoleFromDashboardSlug } from "@/lib/auth/dashboard-role-paths"
import { AnnouncementDeletePage } from "@/components/dashboard/department-head/announcements-delete-page"
import { notFound } from "next/navigation"

interface DeleteIdPageProps {
  params: Promise<{ role: string; section: string; id: string }>
}

export default async function DeleteIdPage({ params }: DeleteIdPageProps) {
  const { role: roleSlug, section, id } = await params
  const role = getRoleFromDashboardSlug(roleSlug)

  if (role !== "department_head" || section !== "announcements") {
    notFound()
  }

  return <AnnouncementDeletePage announcementId={id} />
}
