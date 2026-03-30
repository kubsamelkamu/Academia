import { AnnouncementEditPage } from "@/components/dashboard/department-head/announcements-edit-page"

export default function Page({ params }: { params: { id: string } }) {
  return <AnnouncementEditPage announcementId={params.id} />
}