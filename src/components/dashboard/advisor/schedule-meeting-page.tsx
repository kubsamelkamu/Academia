"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Video } from "lucide-react"

export function AdvisorScheduleMeetingPage() {
  const [team, setTeam] = React.useState("")
  const [date, setDate] = React.useState("")
  const [time, setTime] = React.useState("")
  const [agenda, setAgenda] = React.useState("")

  function schedule() {
    if (!team.trim() || !date.trim() || !time.trim()) {
      toast.error("Missing information", { description: "Please fill team, date, and time." })
      return
    }

    toast.success("Meeting scheduled", { description: `${team} • ${date} ${time}` })
    setTeam("")
    setDate("")
    setTime("")
    setAgenda("")
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Schedule Meeting</h1>
          <p className="text-sm text-muted-foreground">Create a meeting invite for a project team.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/advisor/meetings">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Meeting Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team">Team</Label>
            <Input id="team" value={team} onChange={(e) => setTeam(e.target.value)} placeholder="e.g. Team Atlas" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" value={date} onChange={(e) => setDate(e.target.value)} placeholder="YYYY-MM-DD" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input id="time" value={time} onChange={(e) => setTime(e.target.value)} placeholder="e.g. 14:00" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="agenda">Agenda (optional)</Label>
            <Textarea id="agenda" value={agenda} onChange={(e) => setAgenda(e.target.value)} rows={5} placeholder="Topics to cover..." />
          </div>
          <div className="flex justify-end">
            <Button className="btn-gradient" onClick={schedule}>
              <Video className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvisorScheduleMeetingPage

