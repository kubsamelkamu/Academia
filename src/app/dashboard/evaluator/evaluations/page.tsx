import { redirect } from "next/navigation"

export default function EvaluationsListPage(): never {
  redirect("/dashboard/advisor/evaluator/pending?stage=capstone-ii")
}
