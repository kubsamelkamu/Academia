import { redirect } from "next/navigation"

const LEGACY_EVALUATOR_DETAIL_ROUTE_MAP: Record<
  string,
  {
    projectId: string
    destination: "evaluate" | "project"
  }
> = {
  er1: {
    projectId: "p1",
    destination: "evaluate",
  },
  er2: {
    projectId: "p2",
    destination: "project",
  },
  er3: {
    projectId: "p3",
    destination: "evaluate",
  },
  er4: {
    projectId: "p4",
    destination: "project",
  },
}

function canonicalEvaluatorDetailHref(id: string) {
  const mapped = LEGACY_EVALUATOR_DETAIL_ROUTE_MAP[id]

  if (!mapped) {
    return "/dashboard/advisor/evaluator/pending?stage=capstone-ii"
  }

  if (mapped.destination === "evaluate") {
    return `/dashboard/advisor/evaluator/evaluate/${mapped.projectId}?stage=capstone-ii`
  }

  return `/dashboard/advisor/evaluator/projects/${mapped.projectId}?stage=capstone-ii`
}

export default async function LegacyEvaluatorEvaluationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  redirect(canonicalEvaluatorDetailHref(id))
}
