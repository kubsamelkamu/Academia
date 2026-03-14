import { AdvisorEvaluationDetailPage } from "@/components/dashboard/advisor/evaluation-detail-page"

interface PageProps {
  params: {
    id: string
  }
}

export default function Page({ params }: PageProps) {
  return <AdvisorEvaluationDetailPage evaluationId={params.id} />
}

