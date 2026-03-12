"use client"

import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Video } from "lucide-react"

type MeetingStatus = "scheduled" | "pending_rsvp" | "completed"

interface Meeting {
  id: string
  title: string
  team: string
  when: string
  status: MeetingStatus
}

const meetings: Meeting[] = [
  { id: "mt1", title: "Weekly Progress Review", team: "Team Atlas", when: "Tomorrow, 2:00 PM", status: "scheduled" },
  { id: "mt2", title: "Draft walkthrough", team: "Team Nova", when: "Mon, 9:30 AM", status: "pending_rsvp" },
]

function statusBadge(status: MeetingStatus) {
  if (status === "scheduled") return <Badge variant="secondary">Scheduled</Badge>
  if (status === "pending_rsvp") return <Badge variant="outline">Pending RSVP</Badge>
  return <Badge>Completed</Badge>
}

export function AdvisorMeetingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
          <p className="text-sm text-muted-foreground">Upcoming and recent meetings with your project teams.</p>
        </div>
        <Button asChild className="btn-gradient">
          <Link href="/dashboard/advisor/schedule-meeting">
            <Video className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {meetings.map((m) => (
          <Card key={m.id}>
            <CardHeader>
              <CardTitle className="text-lg">{m.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{m.team}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {m.when}
              </div>
              <div>{statusBadge(m.status)}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default AdvisorMeetingsPage

