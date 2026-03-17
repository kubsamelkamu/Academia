import NotificationListClient from "./notification-list-client"

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Notifications
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Recent notifications for your account.
        </p>
      </div>

      <div className="rounded-lg bg-card p-4">
        <NotificationListClient />
      </div>
    </div>
  )
}
