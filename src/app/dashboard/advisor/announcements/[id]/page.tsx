import { AdvisorAnnouncementDetailPage } from "@/components/dashboard/advisor/announcement-detail-page"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ projectId?: string }>
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params
  const { projectId = "" } = await searchParams

  return <AdvisorAnnouncementDetailPage announcementId={id} projectId={projectId} />
}
