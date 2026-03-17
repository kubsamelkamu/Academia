"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Edit,
  MapPin,
  Plus,
  Trash2,
  Users,
  Video,
} from "lucide-react"

type MeetingType = "virtual" | "in-person"
type AttendeeStatus = "confirmed" | "pending" | "declined"

interface Attendee {
  id: string
  name: string
  role: string
  status: AttendeeStatus
  avatar?: string
}

interface Meeting {
  id: string
  title: string
  project: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  durationMinutes: number
  type: MeetingType
  location: string
  attendees: Attendee[]
  agenda: string
  status: "scheduled"
}

const mockMeetings: Meeting[] = [
  {
    id: "1",
    title: "Weekly Progress Review",
    project: "Smart Campus System",
    date: "2024-01-20",
    time: "10:00",
    durationMinutes: 60,
    type: "virtual",
    location: "Zoom Meeting",
    attendees: [
      { id: "1", name: "John Doe", role: "Team Lead", status: "confirmed", avatar: "" },
      { id: "2", name: "Jane Smith", role: "Developer", status: "confirmed", avatar: "" },
      { id: "3", name: "Mike Johnson", role: "Designer", status: "pending", avatar: "" },
    ],
    agenda: "Review project progress, discuss upcoming milestones, address any blockers",
    status: "scheduled",
  },
  {
    id: "2",
    title: "Mid-term Evaluation",
    project: "AI Chatbot",
    date: "2024-01-25",
    time: "14:00",
    durationMinutes: 120,
    type: "in-person",
    location: "Room 301, Engineering Building",
    attendees: [
      { id: "4", name: "Alex Brown", role: "Team Lead", status: "confirmed", avatar: "" },
      { id: "5", name: "Emma Davis", role: "AI Engineer", status: "confirmed", avatar: "" },
    ],
    agenda: "Present mid-term deliverables, receive feedback, discuss project direction",
    status: "scheduled",
  },
]

function formatDate(yyyyMmDd: string) {
  const [y, m, d] = yyyyMmDd.split("-").map((n) => Number(n))
  const date = new Date(y ?? 2000, (m ?? 1) - 1, d ?? 1)
  return date.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })
}

function formatTime(hhmm: string) {
  // best-effort, without date-fns
  const [h, m] = hhmm.split(":").map((n) => Number(n))
  const d = new Date()
  d.setHours(h ?? 0, m ?? 0, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}

function durationLabel(minutes: number) {
  if (!minutes) return "—"
  if (minutes === 60) return "1 hour"
  if (minutes === 30) return "30 minutes"
  if (minutes === 90) return "1.5 hours"
  if (minutes === 120) return "2 hours"
  return `${minutes} minutes`
}

function meetingTypeIcon(type: MeetingType) {
  return type === "virtual" ? <Video className="h-4 w-4 text-primary" /> : <MapPin className="h-4 w-4 text-primary" />
}

function attendeeStatusBadge(status: AttendeeStatus) {
  switch (status) {
    case "confirmed":
      return <Badge className="bg-success/10 text-success border-success/20">Confirmed</Badge>
    case "pending":
      return <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>
    case "declined":
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Declined</Badge>
  }
}

export function AdvisorSchedulePage() {
  const [selectedDate, setSelectedDate] = React.useState<string>("")
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = React.useState(false)
  const [meetingForm, setMeetingForm] = React.useState({
    title: "",
    project: "",
    date: "",
    time: "",
    durationMinutes: "",
    type: "" as "" | MeetingType,
    location: "",
    agenda: "",
  })

  const meetings = React.useMemo(() => {
    if (!selectedDate) return mockMeetings
    return mockMeetings.filter((m) => m.date === selectedDate)
  }, [selectedDate])

  function handleScheduleMeeting() {
    if (!meetingForm.title.trim() || !meetingForm.date.trim() || !meetingForm.time.trim()) {
      toast.error("Missing information", { description: "Please fill in meeting title, date and time." })
      return
    }

    toast.success("Meeting scheduled", { description: "Invitations have been prepared (mock)." })
    setMeetingForm({
      title: "",
      project: "",
      date: "",
      time: "",
      durationMinutes: "",
      type: "",
      location: "",
      agenda: "",
    })
    setIsScheduleDialogOpen(false)
  }

  const totalMeetings = mockMeetings.length
  const virtualCount = mockMeetings.filter((m) => m.type === "virtual").length
  const inPersonCount = mockMeetings.filter((m) => m.type === "in-person").length
  const avgConfirmed = totalMeetings
    ? Math.round(
        mockMeetings.reduce((acc, m) => acc + m.attendees.filter((a) => a.status === "confirmed").length, 0) / totalMeetings,
      )
    : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Meeting Scheduler</h1>
          <p className="text-muted-foreground">Schedule and manage project meetings</p>
        </div>

        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Schedule New Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl w-[95vw]">
            <DialogHeader>
              <DialogTitle>Schedule New Meeting</DialogTitle>
              <DialogDescription>Set up a new meeting with your project team.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Meeting Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Weekly Progress Review"
                    value={meetingForm.title}
                    onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project</Label>
                  <Input
                    value={meetingForm.project}
                    onChange={(e) => setMeetingForm({ ...meetingForm, project: e.target.value })}
                    placeholder="e.g., Smart Campus System"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={meetingForm.date}
                    onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={meetingForm.time}
                    onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select
                    value={meetingForm.durationMinutes}
                    onValueChange={(value) => setMeetingForm({ ...meetingForm, durationMinutes: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meeting Type</Label>
                  <Select value={meetingForm.type} onValueChange={(value) => setMeetingForm({ ...meetingForm, type: value as MeetingType })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="virtual">Virtual (Zoom/Teams)</SelectItem>
                      <SelectItem value="in-person">In-person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location/Link</Label>
                  <Input
                    id="location"
                    placeholder="Meeting room or Zoom link"
                    value={meetingForm.location}
                    onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agenda">Meeting Agenda</Label>
                <Textarea
                  id="agenda"
                  placeholder="Describe objectives and topics..."
                  value={meetingForm.agenda}
                  onChange={(e) => setMeetingForm({ ...meetingForm, agenda: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleScheduleMeeting} className="btn-gradient">
                Schedule Meeting
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Meetings */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg">Upcoming Meetings</CardTitle>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground" htmlFor="filter-date">
                Filter by date
              </Label>
              <Input
                id="filter-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-[180px]"
              />
              {selectedDate && (
                <Button variant="outline" size="sm" onClick={() => setSelectedDate("")}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Meeting</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Attendees</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetings.map((meeting) => (
                <TableRow key={meeting.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{meeting.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{meeting.agenda}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{meeting.project}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(meeting.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {formatTime(meeting.time)} ({durationLabel(meeting.durationMinutes)})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {meetingTypeIcon(meeting.type)}
                      <span className="capitalize">{meeting.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{meeting.location}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{meeting.attendees.length} attendees</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {meeting.attendees.slice(0, 3).map((attendee) => (
                        <div key={attendee.id} className="flex items-center gap-1">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={attendee.avatar} alt={attendee.name} />
                            <AvatarFallback className="text-[10px]">
                              {attendee.name
                                .split(" ")
                                .filter(Boolean)
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          {attendeeStatusBadge(attendee.status)}
                        </div>
                      ))}
                      {meeting.attendees.length > 3 && (
                        <Badge variant="outline">+{meeting.attendees.length - 3} more</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/advisor/schedule/edit/${meeting.id}`}>
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/advisor/schedule/delete/${meeting.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {meetings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
                    No meetings scheduled{selectedDate ? ` for ${formatDate(selectedDate)}` : ""}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Calendar / Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Calendar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pick a date to filter meetings (native date picker for now).
            </p>
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            <div className="rounded-md border p-3 text-sm text-muted-foreground">
              {selectedDate ? (
                <span>
                  Showing meetings on <span className="font-medium text-foreground">{formatDate(selectedDate)}</span>.
                </span>
              ) : (
                <span>Showing all upcoming meetings.</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Meeting Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Total Meetings</p>
                    <p className="text-sm text-muted-foreground">Upcoming</p>
                  </div>
                </div>
                <span className="text-2xl font-bold">{totalMeetings}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Video className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Virtual Meetings</p>
                    <p className="text-sm text-muted-foreground">Upcoming</p>
                  </div>
                </div>
                <span className="text-2xl font-bold">{virtualCount}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">In-person Meetings</p>
                    <p className="text-sm text-muted-foreground">Upcoming</p>
                  </div>
                </div>
                <span className="text-2xl font-bold">{inPersonCount}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-success" />
                  <div>
                    <p className="font-medium">Confirmed Attendees</p>
                    <p className="text-sm text-muted-foreground">Avg per meeting</p>
                  </div>
                </div>
                <span className="text-2xl font-bold">{avgConfirmed}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdvisorSchedulePage
