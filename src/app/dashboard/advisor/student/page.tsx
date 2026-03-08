"use client"

import { Mail, MoreHorizontal } from "lucide-react"

import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

// Mock data for assigned students
const studentsData = [
    {
        id: "stu-1",
        name: "Alex Mercer",
        email: "alex.mercer@student.academia.et",
        projectTitle: "Machine Learning applied to Smart Grids",
        status: "Active",
        avatar: "/avatars/alex.jpg"
    },
    {
        id: "stu-2",
        name: "Maria Garcia",
        email: "m.garcia@student.academia.et",
        projectTitle: "Blockchain for Supply Chain Transparency",
        status: "Active",
        avatar: "/avatars/maria.jpg"
    },
    {
        id: "stu-3",
        name: "Liam Johnson",
        email: "liam.j@student.academia.et",
        projectTitle: "IoT Home Automation Prototype",
        status: "Completed",
        avatar: ""
    },
    {
        id: "stu-4",
        name: "Sophia Chen",
        email: "sophia.chen@student.academia.et",
        projectTitle: "Natural Language Processing for Healthcare",
        status: "On Leave",
        avatar: ""
    },
    {
        id: "stu-5",
        name: "Jordan Lee",
        email: "jordan.lee@student.academia.et",
        projectTitle: "Machine Learning applied to Smart Grids",
        status: "Active",
        avatar: ""
    },
]

export default function AdvisorStudentPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <DashboardPageHeader
                    title="Assigned Students"
                    description="View and manage the students under your supervision."
                    badge="Students"
                />
                <Button variant="outline" className="gap-2 shrink-0">
                    <Mail className="h-4 w-4" />
                    Message All
                </Button>
            </div>

            <Card className="shadow-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[250px]">Student Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="hidden md:table-cell">Project Title</TableHead>
                                <TableHead className="w-[120px]">Status</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {studentsData.map((student) => (
                                <TableRow key={student.id} className="group hover:bg-muted/50 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border">
                                                <AvatarImage src={student.avatar} />
                                                <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                                                    {student.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-foreground">{student.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground whitespace-nowrap">
                                        {student.email}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-muted-foreground">
                                        <span className="line-clamp-1">{student.projectTitle}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={
                                                student.status === "Active"
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                    : student.status === "Completed"
                                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                                        : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
                                            }
                                        >
                                            {student.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {studentsData.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">
                            No students are currently assigned to you.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
