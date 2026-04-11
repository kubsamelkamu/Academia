import { AdvisorCapstoneGroupEvaluatePage } from "@/components/dashboard/advisor/capstone-group-evaluate-page"

interface PageProps {
  params: {
    groupId: string
  }
}

export default function Page({ params }: PageProps) {
  return <AdvisorCapstoneGroupEvaluatePage stage="Capstone II" groupId={params.groupId} />
}
