import { AdvisorDocumentDetailPage } from "@/components/dashboard/advisor/document-detail-page"

interface PageProps {
  params: {
    id: string
  }
}

export default function Page({ params }: PageProps) {
  return <AdvisorDocumentDetailPage documentId={params.id} />
}

