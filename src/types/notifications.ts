export type NotificationSeverity = "INFO" | "HIGH" | "MEDIUM" | "LOW"

export type NotificationStatus = "UNREAD" | "READ"

export type NotificationMetadata = Record<string, unknown>

export type Notification = {
  id: string
  eventType: string
  severity: NotificationSeverity
  title: string
  message: string
  metadata?: NotificationMetadata | null
  status: NotificationStatus
  readAt?: string | null
  createdAt: string
}

export type ListNotificationsParams = {
  status?: NotificationStatus
  limit?: number
  offset?: number
}

export type ListNotificationsResponse = {
  notifications: Notification[]
  total: number
  unreadCount: number
  limit: number
  offset: number
}

export type NotificationUnreadCountResponse = {
  count: number
}

export type NotificationSummaryResponse = {
  total: number
  unread: number
  bySeverity: Record<string, number>
  recent: Notification[]
}

export type MarkOneReadResponse = {
  success: boolean
  notification?: Notification
}

export type MarkAllReadResponse = {
  success: boolean
  markedCount: number
}
