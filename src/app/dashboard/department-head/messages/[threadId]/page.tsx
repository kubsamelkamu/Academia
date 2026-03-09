import { notFound } from "next/navigation"
import { DepartmentHeadMessagesThreadPage } from "@/components/dashboard/department-head/messages-thread-page"

interface ThreadPageProps {
  params: Promise<{ threadId: string }>
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { threadId } = await params

  if (!threadId) {
    notFound()
  }

  return <DepartmentHeadMessagesThreadPage />
}

