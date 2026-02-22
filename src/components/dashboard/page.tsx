import { type UserRole } from "@/config/navigation"
import { getDashboardUser } from "@/lib/auth/mock-session"
import { CustomizableDashboard } from "@/components/dashboard/customizable-dashboard"

interface DashboardPageProps {
  role: UserRole
}

export default async function DashboardPage({ role }: DashboardPageProps) {
  const user = await getDashboardUser()
  return <CustomizableDashboard role={role} userId={user.id} userName={user.name} />
}
