"use client"

import { useEffect, useState } from "react"
import { Users, Presentation, FileSearch, CheckCircle2 } from "lucide-react"

import { getAdvisorDashboardOverview } from "@/lib/api/advisor"
import { AdvisorDashboardOverview } from "@/lib/types/advisor"
import { DashboardKpiGrid, DashboardPageHeader, DashboardSectionCard } from "@/components/dashboard/page-primitives"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function AdvisorDashboardPage() {
    const [data, setData] = useState<AdvisorDashboardOverview | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchData() {
            try {
                const overview = await getAdvisorDashboardOverview()
                setData(overview)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load dashboard data.")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="flex h-full min-h-[50vh] flex-col items-center justify-center space-y-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-muted-foreground animate-pulse">Loading dashboard overview...</p>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="flex h-full min-h-[50vh] flex-col items-center justify-center space-y-4">
                <div className="rounded-full bg-destructive/10 p-3">
                    <FileSearch className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-destructive">Error Loading Data</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
            </div>
        )
    }

    const { stats, recentProposals, recentMilestones, myStudents } = data

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <DashboardPageHeader
                title="Welcome back, Advisor"
                description="Monitor your students' progress, review proposals, and manage evaluations."
                badge="Advisor Portal"
            />

            {/* KPI Overview */}
            <DashboardKpiGrid
                items={[
                    { title: "Assigned Students", value: stats.totalAssignedStudents.toString(), note: "Under your supervision", icon: Users },
                    { title: "Active Projects", value: stats.totalActiveProjects.toString(), note: "Currently in progress", icon: Presentation },
                    { title: "Pending Proposals", value: stats.pendingProposalReviews.toString(), note: "Needs your review", icon: FileSearch },
                    { title: "Pending Milestones", value: stats.pendingMilestoneReviews.toString(), note: "Awaiting approval", icon: CheckCircle2 },
                ]}
            />

            {/* Main Content Area */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">

                {/* Left Column: Action Items */}
                <div className="space-y-6 lg:col-span-4">

                    <DashboardSectionCard
                        title="Action Items: Proposals"
                        description="Project proposals requiring your approval."
                    >
                        {recentProposals.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg bg-muted/20">
                                No pending proposals to review.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {recentProposals.map((proposal) => (
                                    <div key={proposal.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-all hover:bg-accent/50 group">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-semibold text-sm line-clamp-1">{proposal.title}</h4>
                                                <p className="text-xs text-muted-foreground mt-1">Submitted by {proposal.studentName}</p>
                                            </div>
                                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                                {proposal.status}
                                            </Badge>
                                        </div>
                                        <div className="flex gap-2 justify-end mt-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="sm" variant="outline" className="h-8 text-xs">View Document</Button>
                                            <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700">Review</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </DashboardSectionCard>

                    <DashboardSectionCard
                        title="Action Items: Milestones"
                        description="Recent student milestone submissions to evaluate."
                    >
                        {recentMilestones.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg bg-muted/20">
                                No pending milestones to review.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {recentMilestones.map((milestone) => (
                                    <div key={milestone.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-all hover:bg-accent/50 group">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <Badge variant="outline" className="mb-2 text-[10px] uppercase tracking-wider">{milestone.projectName}</Badge>
                                                <h4 className="font-semibold text-sm line-clamp-1">{milestone.title}</h4>
                                                <p className="text-xs text-muted-foreground mt-1">Due: {new Date(milestone.dueDate).toLocaleDateString()}</p>
                                            </div>
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                {milestone.status}
                                            </Badge>
                                        </div>
                                        <div className="flex gap-2 justify-end mt-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="sm" variant="outline" className="h-8 text-xs">Evaluate</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </DashboardSectionCard>
                </div>

                {/* Right Column: Students Quick List */}
                <div className="space-y-6 lg:col-span-3">
                    <Card className="shadow-sm border-muted/60 h-full flex flex-col">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-lg">My Students</CardTitle>
                            <CardDescription>Quick view of your assigned mentees</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 flex-1">
                            <div className="space-y-4">
                                {myStudents.map((student) => (
                                    <div key={student.id} className="flex items-center gap-3">
                                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                            {student.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{student.projectName || "No Project Yet"}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                            <Users className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 pt-4 border-t w-full">
                                <Button variant="outline" className="w-full text-xs" size="sm">
                                    View All Students
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
