"use client"

import { Plus, Video, MapPin } from "lucide-react"

import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

// Mock data for advisor meeting schedule
const scheduleData = [
    {
        id: "mtg-1",
        date: "2024-05-20",
        time: "10:00 AM",
        studentGroup: "Machine Learning applied to Smart Grids",
        meetingType: "Project Review",
        mode: "Online",
    },
    {
        id: "mtg-2",
        date: "2024-05-20",
        time: "02:00 PM",
        studentGroup: "Blockchain for Supply Chain Transparency",
        meetingType: "Proposal Defense",
        mode: "In-Person (Room 304)",
    },
    {
        id: "mtg-3",
        date: "2024-05-22",
        time: "09:30 AM",
        studentGroup: "IoT Home Automation Prototype",
        meetingType: "Weekly Sync",
        mode: "Online",
    },
    {
        id: "mtg-4",
        date: "2024-05-25",
        time: "11:00 AM",
        studentGroup: "Natural Language Processing for Healthcare",
        meetingType: "Final Evaluation",
        mode: "In-Person (Room 102)",
    },
]

export default function AdvisorSchedulePage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <DashboardPageHeader
                    title="Meeting Schedule"
                    description="Manage your upcoming meetings, defenses, and project reviews."
                    badge="Calendar"
                />
                <Button className="gap-2 shrink-0">
                    <Plus className="h-4 w-4" />
                    Add Schedule
                </Button>
            </div>

            <Card className="shadow-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[150px]">Date</TableHead>
                                <TableHead className="w-[120px]">Time</TableHead>
                                <TableHead>Student Group (Project)</TableHead>
                                <TableHead className="w-[180px]">Meeting Type</TableHead>
                                <TableHead className="text-right w-[150px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {scheduleData.map((meeting) => (
                                <TableRow key={meeting.id} className="group hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium">
                                        {new Date(meeting.date).toLocaleDateString(undefined, {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground font-medium">{meeting.time}</TableCell>
                                    <TableCell>
                                        <div className="font-medium mb-1 line-clamp-1">{meeting.studentGroup}</div>
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            {meeting.mode.includes("Online") ? (
                                                <Video className="h-3 w-3 mr-1 text-blue-500" />
                                            ) : (
                                                <MapPin className="h-3 w-3 mr-1 text-emerald-500" />
                                            )}
                                            {meeting.mode}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-normal text-xs bg-slate-100 dark:bg-slate-800">
                                            {meeting.meetingType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="outline" className="h-8 text-xs">
                                            Reschedule
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {scheduleData.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">
                            No meetings scheduled.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
