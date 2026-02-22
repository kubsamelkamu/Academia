import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import NotificationListClient from "./notification-list-client"

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Notifications"
        description="Recent notifications for your department."
        actions={null}
      />

      <div className="rounded-lg bg-card p-4">
        <NotificationListClient />
      </div>
    </div>
  )
}
