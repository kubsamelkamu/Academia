self.addEventListener("push", (event) => {
  if (!event.data) {
    return
  }

  let payload = {}
  try {
    payload = event.data.json()
  } catch {
    payload = { title: "Notification", body: event.data.text() }
  }

  const title = typeof payload.title === "string" && payload.title.trim() ? payload.title : "Notification"
  const body = typeof payload.body === "string" ? payload.body : "You have a new notification."
  const url = typeof payload.url === "string" && payload.url.startsWith("/") ? payload.url : "/dashboard/notifications"
  const tag = typeof payload.tag === "string" && payload.tag.trim() ? payload.tag : undefined

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      data: { url },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const url = typeof event.notification.data?.url === "string"
    ? event.notification.data.url
    : "/dashboard/notifications"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url)
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }

      return undefined
    })
  )
})
