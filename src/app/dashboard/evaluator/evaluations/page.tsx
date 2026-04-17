import { redirect } from "next/navigation"

export default function EvaluationsListPage() {
  redirect("/dashboard/advisor/evaluator/pending?stage=capstone-ii")
}
