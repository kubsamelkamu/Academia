import { getDashboardUser } from "@/lib/auth/mock-session"
import { SettingsPageClient } from "@/components/dashboard/settings/settings-page-client"

export default async function SettingsPage() {
  const user = await getDashboardUser()

  return <SettingsPageClient role={user.role} />
}
