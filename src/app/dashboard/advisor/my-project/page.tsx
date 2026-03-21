"use client"

import { Users, ExternalLink, CalendarDays, Activity } from "lucide-react"

import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

// Mock Data
const supervisedProjects = [
    {
        id: "proj-1",
        title: "Machine Learning applied to Smart Grids",
        students: ["Alex Mercer", "Jordan Lee", "Casey Smith"],
        status: "Active",
        progress: 65,
        dueDate: "2024-12-15",
    },
    {
        id: "proj-2",
        title: "Blockchain for Supply Chain Transparency",
        students: ["Maria Garcia", "Elena Rostova"],
        status: "Active",
        progress: 40,
        dueDate: "2025-01-20",
    },
    {
        id: "proj-3",
        title: "IoT Home Automation Prototype",
        students: ["Liam Johnson"],
        status: "Completed",
        progress: 100,
        dueDate: "2024-03-10",
    },
    {
        id: "proj-4",
        title: "Natural Language Processing for Healthcare",
        students: ["Sophia Chen", "Ravi Patel"],
        status: "Active",
        progress: 85,
        dueDate: "2024-11-30",
    },
]

export default function AdvisorMyProjectPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <DashboardPageHeader
                title="My Projects"
                description="Manage and track the progress of the projects you are supervising."
                badge="Supervision"
            />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {supervisedProjects.map((project) => (
                    <Card key={project.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                        <CardHeader className="pb-4 border-b">
                            <div className="flex justify-between items-start gap-4 mb-2">
                                <CardTitle className="text-lg leading-tight line-clamp-2 min-h-[3rem]">
                                    {project.title}
                                </CardTitle>
                                <Badge
                                    variant="secondary"
                                    className={
                                        project.status === "Active"
                                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400"
                                            : "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400"
                                    }
                                >
                                    {project.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 flex-1 space-y-4">

                            {/* Students List */}
                            <div>
                                <div className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                                    <Users className="h-4 w-4 mr-2" />
                                    Project Team ({project.students.length})
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {project.students.map((student, idx) => (
                                        <Badge key={idx} variant="outline" className="font-normal bg-muted/30">
                                            {student}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="pt-2">
                                <div className="flex justify-between text-xs font-medium mb-1">
                                    <span className="flex items-center text-muted-foreground"><Activity className="h-3 w-3 mr-1" /> Progress</span>
                                    <span>{project.progress}%</span>
                                </div>
                                <Progress value={project.progress} className="h-2" />
                            </div>

                            {/* Due Date */}
                            <div className="flex items-center text-sm text-muted-foreground">
                                <CalendarDays className="h-4 w-4 mr-2" />
                                Due: {new Date(project.dueDate).toLocaleDateString()}
                            </div>

                        </CardContent>
                        <CardFooter className="pt-4 pb-4 border-t bg-muted/10">
                            <Button className="w-full gap-2" variant={project.status === "Active" ? "default" : "outline"}>
                                View Details
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
                {supervisedProjects.length === 0 && (
                    <div className="col-span-full p-8 text-center text-muted-foreground border rounded-lg bg-muted/20">
                        You are not currently supervising any projects.
                    </div>
                )}
            </div>
        </div>
    )
}
