"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, CheckCircle2, ClipboardList, FolderKanban, GraduationCap } from "lucide-react"

type FocusFilter = "All" | "Feedback" | "Review"

interface FollowupItem {
  id: string
  team: string
  task: string
  focus: Exclude<FocusFilter, "All">
  due: string
}

const followups: FollowupItem[] = [
  { id: "f1", team: "Team Nova", task: "Methodology revision feedback", focus: "Feedback", due: "Due Thu" },
  { id: "f2", team: "Team Atlas", task: "Implementation review", focus: "Review", due: "Due Fri" },
  { id: "f3", team: "Team Orion", task: "Final chapter comments", focus: "Feedback", due: "Due Mon" },
]

export function AdvisorDashboard() {
  const [focus, setFocus] = useState<FocusFilter>("All")

  const visibleFollowups = useMemo(
    () => followups.filter((item) => (focus === "All" ? true : item.focus === focus)),
    [focus]
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Advisor Dashboard</h1>
        <p className="text-muted-foreground">
          Oversee assigned projects, student progress, and pending evaluation duties.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assigned Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">8</p>
            <p className="text-xs text-muted-foreground">Current department cycle</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">27</p>
            <p className="text-xs text-muted-foreground">Across project teams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Evaluations</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">4</p>
            <p className="text-xs text-muted-foreground">Need completion this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Review Completion</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">82%</p>
            <p className="text-xs text-muted-foreground">On-time response rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Student Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap gap-2">
              {(["All", "Feedback", "Review"] as FocusFilter[]).map((item) => (
                <Button
                  key={item}
                  type="button"
                  size="sm"
                  variant={focus === item ? "default" : "outline"}
                  onClick={() => setFocus(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
            <div className="space-y-3">
              {visibleFollowups.map((item) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{item.team} • {item.task}</p>
                    <Badge variant={item.focus === "Feedback" ? "secondary" : "outline"}>{item.focus}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.due}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">Defense rehearsal</p>
                <div className="mt-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Fri, 11:00 AM</span>
                </div>
                <div className="mt-2">
                  <Badge variant="secondary">Scheduled</Badge>
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">Team Orion • Draft walkthrough</p>
                <div className="mt-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Mon, 9:30 AM</span>
                </div>
                <div className="mt-2">
                  <Badge variant="outline">Pending RSVP</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
