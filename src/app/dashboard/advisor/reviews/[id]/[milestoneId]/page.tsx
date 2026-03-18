import { redirect } from "next/navigation"

interface PageProps {
  params: { id: string; milestoneId: string }
}

export default function Page({ params }: PageProps) {
  redirect(
    `/dashboard/advisor/reviews/${encodeURIComponent(params.id)}?milestone=${encodeURIComponent(params.milestoneId)}`
  )
}

