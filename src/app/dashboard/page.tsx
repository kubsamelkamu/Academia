import DashboardPage from "@/components/dashboard/page"
import { getDashboardUser } from "@/lib/auth/mock-session"

export default async function Page() {
  const user = await getDashboardUser()

  return <DashboardPage role={user.role} />
}