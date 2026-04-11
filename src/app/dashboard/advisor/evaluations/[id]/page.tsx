import { redirect } from "next/navigation"

import { getGroupById } from "@/components/dashboard/advisor/capstone-evaluation-data"

interface PageProps {
  params: {
    id: string
  }
}

export default function Page({ params }: PageProps) {
  const group = getGroupById(params.id)

  if (!group) {
    redirect("/dashboard/advisor/evaluations")
  }

  redirect(`/dashboard/advisor/evaluations/${group.stage === "Capstone I" ? "capstone-i" : "capstone-ii"}/${group.id}/detail`)
}

