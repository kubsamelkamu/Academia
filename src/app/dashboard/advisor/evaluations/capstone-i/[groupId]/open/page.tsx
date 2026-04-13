import { AdvisorCapstoneGroupEvaluatePage } from "@/components/dashboard/advisor/capstone-group-evaluate-page"

interface PageProps {
  params: Promise<{
    groupId: string
  }>
}

export default async function Page({ params }: PageProps) {
  const { groupId } = await params

  return <AdvisorCapstoneGroupEvaluatePage stage="Capstone I" groupId={groupId} />
}
