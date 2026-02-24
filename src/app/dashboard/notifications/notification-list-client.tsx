'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { NotificationItem } from '@/components/notifications/notification-item'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsList,
} from '@/lib/hooks/use-notifications'
import type { ListNotificationsParams } from '@/types/notifications'

type FilterValue = 'all' | 'unread'

const PAGE_SIZE = 10

export default function NotificationListClient() {
  const [filter, setFilter] = React.useState<FilterValue>('all')
  const [page, setPage] = React.useState(1)

  const params: ListNotificationsParams = React.useMemo(() => {
    const base: ListNotificationsParams = {
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }

    if (filter === 'unread') {
      base.status = 'UNREAD'
    }

    return base
  }, [filter, page])

  const { data, isLoading, isError } = useNotificationsList(params)
  const markOne = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  const items = data?.notifications ?? []
  const hasUnread = (data?.unreadCount ?? 0) > 0
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  React.useEffect(() => {
    setPage(1)
  }, [filter])

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-medium">Recent</h3>
          <Tabs value={filter} onValueChange={(v) => setFilter((v as FilterValue) || 'all')}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAll.mutate()}
            disabled={!hasUnread || markAll.isPending}
          >
            Mark all read
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : isError ? (
          <div className="text-sm text-destructive">Failed to load notifications</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No notifications</div>
        ) : (
          items.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkRead={async (id) => {
                if (markOne.isPending) return
                await markOne.mutateAsync(id)
              }}
            />
          ))
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-muted-foreground">
          {total > 0 ? (
            <span>
              Page {page} of {totalPages} • {total} total
            </span>
          ) : (
            <span>Page 1 of 1</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
