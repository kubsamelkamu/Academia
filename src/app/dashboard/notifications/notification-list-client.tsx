'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Notification = {
  id: string
  title: string
  body?: string
  createdAt: string
  read?: boolean
}

export default function NotificationListClient() {
  const [items, setItems] = React.useState<Notification[]>(() => [
    {
      id: '1',
      title: 'New project submission: AI in Education',
      body: 'Student A submitted a new project for review.',
      createdAt: new Date().toISOString(),
      read: false,
    },
    {
      id: '2',
      title: 'Defense scheduled',
      body: 'Defense for Project B scheduled on 2026-03-05.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      read: false,
    },
  ])

  function markRead(id: string) {
    setItems((cur) => cur.map((it) => (it.id === id ? { ...it, read: true } : it)))
  }

  function markAllRead() {
    setItems((cur) => cur.map((it) => ({ ...it, read: true })))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Recent</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Mark all read
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No notifications</div>
        ) : (
          items.map((n) => (
            <div key={n.id} className="flex items-start justify-between gap-4 rounded-md border p-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{n.title}</p>
                  {!n.read ? <Badge variant="secondary">New</Badge> : null}
                </div>
                {n.body ? <p className="text-sm text-muted-foreground mt-1">{n.body}</p> : null}
                <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>

              <div className="flex-shrink-0">
                {!n.read ? (
                  <Button size="sm" variant="outline" onClick={() => markRead(n.id)}>
                    Mark read
                  </Button>
                ) : (
                  <span className="text-sm text-muted-foreground">Read</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
