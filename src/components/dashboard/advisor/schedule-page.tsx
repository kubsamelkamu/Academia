"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  useAdvisorProjects,
  useAdvisorSchedule,
  useCreateMeetingMutation,
  useDeleteMeetingMutation,
  useUpdateMeetingMutation,
} from "@/lib/hooks/useAdvisor"
import { Calendar, Loader2, MapPin, Pencil, Trash2, Video } from "lucide-react"

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatTime(value: string) {
  return new Date(`1970-01-01T${value}:00`).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

const EMPTY_FORM = {
  projectId: "",
  title: "",
  date: "",
  time: "",
  durationMinutes: "60",
  type: "VIRTUAL" as "VIRTUAL" | "IN_PERSON",
  location: "",
  agenda: "",
}

export function AdvisorSchedulePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit") ?? ""
  const deleteId = searchParams.get("delete") ?? ""

  const projectsQuery = useAdvisorProjects()
  const scheduleQuery = useAdvisorSchedule()
  const createMeetingMutation = useCreateMeetingMutation()
  const updateMeetingMutation = useUpdateMeetingMutation()
  const deleteMeetingMutation = useDeleteMeetingMutation()

  const [selectedDate, setSelectedDate] = React.useState("")
  const [form, setForm] = React.useState(EMPTY_FORM)
  const [editingId, setEditingId] = React.useState("")

  const projects = projectsQuery.data?.items ?? []
  const allMeetings = scheduleQuery.data?.items ?? []
  const meetings = React.useMemo(() => {
    return selectedDate ? allMeetings.filter((meeting) => meeting.date === selectedDate) : allMeetings
  }, [allMeetings, selectedDate])

  React.useEffect(() => {
    if (!form.projectId && projects[0]?.id) {
      setForm((current) => ({ ...current, projectId: projects[0].id }))
    }
  }, [form.projectId, projects])

  React.useEffect(() => {
    if (!editId) return
    const meeting = allMeetings.find((item) => item.id === editId)
    if (!meeting) return
    const project = projects.find((candidate) => candidate.id === meeting.projectId || candidate.title === meeting.project || candidate.groupName === meeting.project)
    setEditingId(meeting.id)
    setForm({
      projectId: meeting.projectId || project?.id || projects[0]?.id || "",
      title: meeting.title,
      date: meeting.date,
      time: meeting.time,
      durationMinutes: String(meeting.durationMinutes),
      type: meeting.type === "in-person" ? "IN_PERSON" : "VIRTUAL",
      location: meeting.location,
      agenda: meeting.agenda,
    })
  }, [allMeetings, editId, projects])

  React.useEffect(() => {
    if (!deleteId) return
    if (deleteMeetingMutation.isPending) return
    const meeting = allMeetings.find((item) => item.id === deleteId)
    if (!meeting) return
    const confirmed = window.confirm(`Delete ${meeting.title}?`)
    if (!confirmed) {
      router.replace("/dashboard/advisor/schedule")
      return
    }
    void (async () => {
      try {
        await deleteMeetingMutation.mutateAsync(deleteId)
        toast.success("Meeting deleted.")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete meeting")
      } finally {
        router.replace("/dashboard/advisor/schedule")
      }
    })()
  }, [allMeetings, deleteId, deleteMeetingMutation, router])

  async function handleSubmit() {
    if (!form.projectId || !form.title.trim() || !form.date || !form.time) {
      toast.error("Project, title, date, and time are required.")
      return
    }

    const payload = {
      projectId: form.projectId,
      title: form.title.trim(),
      date: form.date,
      time: form.time,
      durationMinutes: Number(form.durationMinutes) || 60,
      type: form.type,
      location: form.location.trim() || undefined,
      agenda: form.agenda.trim() || undefined,
    }

    try {
      if (editingId) {
        await updateMeetingMutation.mutateAsync({
          meetingId: editingId,
          dto: {
            title: payload.title,
            date: payload.date,
            time: payload.time,
            durationMinutes: payload.durationMinutes,
            type: payload.type,
            location: payload.location,
            agenda: payload.agenda,
          },
        })
        toast.success("Meeting updated.")
        router.replace("/dashboard/advisor/schedule")
      } else {
        await createMeetingMutation.mutateAsync(payload)
        toast.success("Meeting scheduled.")
      }
      setEditingId("")
      setForm({ ...EMPTY_FORM, projectId: payload.projectId })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save meeting")
    }
  }

  const stats = scheduleQuery.data?.stats ?? {
    totalMeetings: 0,
    virtualCount: 0,
    inPersonCount: 0,
    averageConfirmedAttendees: 0,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meeting Scheduler</h1>
          <p className="text-sm text-muted-foreground">Schedule, edit, and delete advisor meetings from the real backend.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/advisor/meetings">Meetings View</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{stats.totalMeetings}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Virtual</p><p className="text-2xl font-bold">{stats.virtualCount}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">In person</p><p className="text-2xl font-bold">{stats.inPersonCount}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Avg confirmed</p><p className="text-2xl font-bold">{stats.averageConfirmedAttendees}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Meeting" : "Schedule Meeting"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={form.projectId} onValueChange={(value) => setForm((current) => ({ ...current, projectId: value }))}>
                <SelectTrigger><SelectValue placeholder="Choose project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.groupName} - {project.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Weekly progress review" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input id="time" type="time" value={form.time} onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input id="duration" type="number" min="15" value={form.durationMinutes} onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(value: "VIRTUAL" | "IN_PERSON") => setForm((current) => ({ ...current, type: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIRTUAL">Virtual</SelectItem>
                  <SelectItem value="IN_PERSON">In person</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location / Link</Label>
            <Input id="location" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Zoom link or room" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agenda">Agenda</Label>
            <Textarea id="agenda" rows={4} value={form.agenda} onChange={(event) => setForm((current) => ({ ...current, agenda: event.target.value }))} placeholder="Discuss milestones, blockers, and next steps..." />
          </div>
          <div className="flex justify-end gap-2">
            {editingId ? (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingId("")
                  setForm({ ...EMPTY_FORM, projectId: projects[0]?.id ?? "" })
                  router.replace("/dashboard/advisor/schedule")
                }}
              >
                Cancel Edit
              </Button>
            ) : null}
            <Button onClick={handleSubmit} disabled={createMeetingMutation.isPending || updateMeetingMutation.isPending || projectsQuery.isLoading}>
              {createMeetingMutation.isPending || updateMeetingMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2 h-4 w-4" />}
              {editingId ? "Save Meeting" : "Schedule Meeting"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Upcoming Meetings</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="date-filter" className="text-xs text-muted-foreground">Filter date</Label>
              <Input id="date-filter" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="w-[180px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Meeting</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Attendees</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scheduleQuery.isLoading ? (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">Loading meetings...</TableCell></TableRow>
              ) : meetings.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">No meetings found.</TableCell></TableRow>
              ) : (
                meetings.map((meeting) => (
                  <TableRow key={meeting.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{meeting.title}</p>
                        <p className="text-sm text-muted-foreground">{meeting.project}</p>
                        {meeting.agenda ? <p className="line-clamp-2 text-xs text-muted-foreground">{meeting.agenda}</p> : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" />{formatDate(meeting.date)}</div>
                        <div className="mt-1 text-muted-foreground">{formatTime(meeting.time)} - {meeting.durationMinutes} min</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          {meeting.type === "virtual" ? <Video className="h-4 w-4 text-primary" /> : <MapPin className="h-4 w-4 text-primary" />}
                          <span className="capitalize">{meeting.type}</span>
                        </div>
                        <div className="mt-1 text-muted-foreground">{meeting.location || "TBD"}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {meeting.attendees.map((attendee) => (
                          <div key={attendee.id} className="flex items-center gap-2 rounded-full bg-muted px-2 py-1 text-xs">
                            <Avatar className="h-6 w-6"><AvatarImage src={attendee.avatar} alt={attendee.name} /><AvatarFallback>{getInitials(attendee.name)}</AvatarFallback></Avatar>
                            <span>{attendee.name}</span>
                            <Badge variant="outline">{attendee.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/advisor/schedule/edit/${meeting.id}`}>
                            <Pencil className="mr-1 h-4 w-4" /> Edit
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/advisor/schedule/delete/${meeting.id}`)} disabled={deleteMeetingMutation.isPending}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvisorSchedulePage
