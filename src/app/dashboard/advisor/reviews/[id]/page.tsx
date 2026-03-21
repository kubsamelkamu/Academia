import { AdvisorProjectReviewsPage } from "@/components/dashboard/advisor/project-reviews-page"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  return <AdvisorProjectReviewsPage projectId={id} />
}