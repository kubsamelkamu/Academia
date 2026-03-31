import { redirect } from "next/navigation"

export default function VerifyInstitutionPage() {
  redirect("/dashboard/settings?tab=verification")
}
