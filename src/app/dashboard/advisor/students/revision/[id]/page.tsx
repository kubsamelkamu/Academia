import { AdvisorStudentsRevisionPage } from "@/components/dashboard/advisor/students-revision-page"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  return <AdvisorStudentsRevisionPage projectId={id} />
}

