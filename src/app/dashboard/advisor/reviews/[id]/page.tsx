import { AdvisorStudentsRevisionPage } from "@/components/dashboard/advisor/students-revision-page"

interface PageProps {
  params: {
    id: string
  }
}

export default function Page({ params }: PageProps) {
  return <AdvisorStudentsRevisionPage projectId={params.id} />
}

