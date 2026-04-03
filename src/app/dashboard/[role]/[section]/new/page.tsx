import { getRoleFromDashboardSlug } from "@/lib/auth/dashboard-role-paths"
import { AnnouncementNewPage } from "@/components/dashboard/department-head/announcements-new-page"
import { notFound } from "next/navigation"

interface SectionNewPageProps {
  params: Promise<{ role: string; section: string }>
}

export default async function SectionNewPage({ params }: SectionNewPageProps) {
  const { role: roleSlug, section } = await params
  const role = getRoleFromDashboardSlug(roleSlug)

  if (role !== "department_head") {
    notFound()
  }

  if (section === "announcements") {
    return <AnnouncementNewPage />
  }

  notFound()
}
