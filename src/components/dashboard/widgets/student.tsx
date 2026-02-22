"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock3, CheckCircle2, FolderKanban, Users } from "lucide-react"

function StudentKpisWidget() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">My Project</CardTitle>
          <FolderKanban className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">1</p>
          <p className="text-xs text-muted-foreground">Smart Defense Assistant</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">4</p>
          <p className="text-xs text-muted-foreground">Including you</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Completed Milestones</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">3/5</p>
          <p className="text-xs text-muted-foreground">60% complete</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Next Deadline</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">4d</p>
          <p className="text-xs text-muted-foreground">Final draft submission</p>
        </CardContent>
      </Card>
    </div>
  )
}

function StudentTimelineWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Proposal approved</p>
            <p className="text-xs text-muted-foreground">Completed 2 weeks ago</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Implementation review</p>
            <p className="text-xs text-muted-foreground">Scheduled this Friday</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StudentActionsWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Action Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Upload chapter 4 draft</p>
            <div className="mt-2">
              <Badge variant="destructive">Due in 4 days</Badge>
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Advisor feedback response</p>
            <div className="mt-2">
              <Badge variant="secondary">In progress</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StudentDefenseWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock3 className="h-4 w-4" />
          Upcoming Defense
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm font-medium">Defense schedule pending</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your coordinator will publish the final defense slot soon.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export const StudentWidgets = {
  "st.kpis": {
    meta: {
      id: "st.kpis",
      title: "KPIs",
      rolesAllowed: ["student"],
      defaultSize: { w: 12, h: 3 },
      minSize: { w: 6, h: 3 },
    },
    component: StudentKpisWidget,
  },
  "st.timeline": {
    meta: {
      id: "st.timeline",
      title: "Progress Timeline",
      rolesAllowed: ["student"],
      defaultSize: { w: 8, h: 5 },
      minSize: { w: 4, h: 4 },
    },
    component: StudentTimelineWidget,
  },
  "st.actions": {
    meta: {
      id: "st.actions",
      title: "Action Items",
      rolesAllowed: ["student"],
      defaultSize: { w: 4, h: 5 },
      minSize: { w: 4, h: 4 },
    },
    component: StudentActionsWidget,
  },
  "st.defense": {
    meta: {
      id: "st.defense",
      title: "Upcoming Defense",
      rolesAllowed: ["student"],
      defaultSize: { w: 12, h: 4 },
      minSize: { w: 6, h: 4 },
    },
    component: StudentDefenseWidget,
  },
} as const
