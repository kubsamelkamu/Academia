import { redirect } from "next/navigation"

export default function AssignedProjectsPage(): never {
  redirect("/dashboard/advisor/evaluator/pending?stage=capstone-ii")
}
