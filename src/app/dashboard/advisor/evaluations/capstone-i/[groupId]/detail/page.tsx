import { AdvisorCapstoneGroupDetailPage } from "@/components/dashboard/advisor/capstone-group-detail-page"

interface PageProps {
  params: {
    groupId: string
  }
}

export default function Page({ params }: PageProps) {
  return <AdvisorCapstoneGroupDetailPage stage="Capstone I" groupId={params.groupId} />
}
