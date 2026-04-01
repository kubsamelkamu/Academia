"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  ChevronRight,
  Award,
  Activity,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const MOCK_SCHEDULE = [
  {
    id: "d1",
    projectTitle: "AI-Driven Academic Assistant",
    groupName: "AI Research Group",
    advisor: "Prof. Lisa Anderson",
    date: "2024-02-10T09:00:00Z",
    duration: 60,
    room: "Room A-201",
    building: "Engineering Building",
    evaluators: ["Dr. David Martinez", "Prof. Anna Williams"],
    status: "upcoming" as const,
    evaluationStatus: "pending" as const,
    notes: "Final project defense. Student team has prepared a live demo.",
  },
  {
    id: "d2",
    projectTitle: "Secure Research Data Platform",
    groupName: "Security Systems",
    advisor: "Prof. Emily Davis",
    date: "2024-02-18T10:00:00Z",
    duration: 75,
    room: "Room C-310",
    building: "Computer Science Building",
    evaluators: ["Dr. David Martinez", "Dr. Michael Brown"],
    status: "upcoming" as const,
    evaluationStatus: "in_progress" as const,
    notes: "Extended defense session due to project complexity.",
  },
  {
    id: "d3",
    projectTitle: "Real-Time Campus Analytics",
    groupName: "Data Analytics Team",
    advisor: "Dr. Michael Brown",
    date: "2024-01-28T14:00:00Z",
    duration: 60,
    room: "Room B-105",
    building: "Data Science Lab",
    evaluators: ["Dr. David Martinez"],
    status: "completed" as const,
    evaluationStatus: "submitted" as const,
    notes: "Defense completed. Evaluation submitted.",
  },
  {
    id: "d4",
    projectTitle: "Smart Campus Navigation",
    groupName: "Mobile Dev Team",
    advisor: "Dr. Robert Taylor",
    date: "2024-01-18T11:00:00Z",
    duration: 60,
    room: "Room A-101",
    building: "Engineering Building",
    evaluators: ["Dr. David Martinez", "Prof. Lisa Anderson"],
    status: "completed" as const,
    evaluationStatus: "reviewed" as const,
    notes: "Excellent presentation. All evaluations finalized.",
  },
]

const defenseStatusConfig = {
  upcoming: { label: "Upcoming", color: "bg-blue-500/10 text-blue-600 border-blue-300", icon: Clock },
  completed: { label: "Completed", color: "bg-emerald-500/10 text-emerald-600 border-emerald-300", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-rose-500/10 text-rose-600 border-rose-300", icon: AlertCircle },
}

const evalStatusConfig = {
  pending: { label: "Evaluation Pending", color: "bg-amber-500/10 text-amber-600 border-amber-300" },
  in_progress: { label: "In Progress", color: "bg-blue-500/10 text-blue-600 border-blue-300" },
  submitted: { label: "Submitted", color: "bg-violet-500/10 text-violet-600 border-violet-300" },
  reviewed: { label: "Reviewed", color: "bg-emerald-500/10 text-emerald-600 border-emerald-300" },
}

export default function EvaluatorSchedulePage() {
  const upcoming = MOCK_SCHEDULE.filter(d => d.status === "upcoming")
  const completed = MOCK_SCHEDULE.filter(d => d.status === "completed")

  const stats = [
    { label: "Total Defenses", value: MOCK_SCHEDULE.length, icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
    { label: "Upcoming", value: upcoming.length, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Completed", value: completed.length, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Evaluations Due", value: MOCK_SCHEDULE.filter(d => d.evaluationStatus === "pending" || d.evaluationStatus === "in_progress").length, icon: ClipboardCheck, color: "text-amber-500", bg: "bg-amber-500/10" },
  ]

  return (
    <div className="space-y-6 pb-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/evaluator">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">Defense Schedule</h1>
          <p className="text-sm text-muted-foreground">Your assigned project defense sessions and evaluation deadlines</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(s => (
          <Card key={s.label} className="border-none shadow-sm">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming Alert */}
      {upcoming.length > 0 && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-500/5 p-4 flex items-start gap-3">
          <Calendar className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-700 dark:text-blue-400">
              {upcoming.length} upcoming defense session{upcoming.length !== 1 ? "s" : ""}
            </p>
            <p className="text-sm text-blue-600/80 dark:text-blue-500/80 mt-0.5">
              Next: <span className="font-medium">{upcoming[0].projectTitle}</span> on {new Date(upcoming[0].date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <Link href={`/dashboard/evaluator/evaluations/${upcoming[0].id}`} className="ml-auto shrink-0">
            <Button size="sm" className="btn-gradient gap-1.5 h-8 text-xs">
              <ClipboardCheck className="h-3.5 w-3.5" /> Prepare
            </Button>
          </Link>
        </div>
      )}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="h-10">
          <TabsTrigger value="all" className="gap-1.5">All <Badge variant="secondary" className="text-xs px-1.5 py-0 ml-1">{MOCK_SCHEDULE.length}</Badge></TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-1.5">Upcoming <Badge variant="secondary" className="text-xs px-1.5 py-0 ml-1">{upcoming.length}</Badge></TabsTrigger>
          <TabsTrigger value="completed" className="gap-1.5">Completed <Badge variant="secondary" className="text-xs px-1.5 py-0 ml-1">{completed.length}</Badge></TabsTrigger>
        </TabsList>

        {[
          { value: "all", data: MOCK_SCHEDULE },
          { value: "upcoming", data: upcoming },
          { value: "completed", data: completed },
        ].map(tab => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-4">
            {tab.data
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(defense => {
                const dConfig = defenseStatusConfig[defense.status]
                const eConfig = evalStatusConfig[defense.evaluationStatus]
                const StatusIcon = dConfig.icon
                const isPast = new Date(defense.date) < new Date()
                const isToday = new Date(defense.date).toDateString() === new Date().toDateString()
                const defenseDate = new Date(defense.date)

                return (
                  <Card key={defense.id} className={`transition-all hover:shadow-md ${isToday ? "border-blue-400 dark:border-blue-600" : ""}`}>
                    <CardContent className="p-0">
                      {/* Date Header */}
                      <div className={`flex items-center gap-4 px-4 py-3 border-b ${isToday ? "bg-blue-500/5" : "bg-muted/20"}`}>
                        <div className={`shrink-0 text-center rounded-xl p-2 min-w-[64px] ${isToday ? "bg-blue-500 text-white" : isPast ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                          <p className="text-xl font-bold leading-none">{defenseDate.getDate()}</p>
                          <p className="text-xs font-medium">{defenseDate.toLocaleDateString("en-US", { month: "short" })}</p>
                          <p className="text-xs opacity-70">{defenseDate.getFullYear()}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{defense.projectTitle}</h3>
                          <p className="text-sm text-muted-foreground">{defense.groupName}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isToday && <Badge className="text-xs bg-blue-500 text-white">Today</Badge>}
                          <Badge className={`text-xs ${dConfig.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />{dConfig.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-4 space-y-4">
                        {/* Info Grid */}
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                              <p className="font-medium">{defenseDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
                              <p className="text-xs text-muted-foreground">{defense.duration} minutes</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                              <p className="font-medium">{defense.room}</p>
                              <p className="text-xs text-muted-foreground">{defense.building}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">{defense.advisor.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{defense.advisor}</p>
                              <p className="text-xs text-muted-foreground">Supervisor</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                              <p className="font-medium">{defense.evaluators.length} evaluator{defense.evaluators.length !== 1 ? "s" : ""}</p>
                              <p className="text-xs text-muted-foreground">Panel</p>
                            </div>
                          </div>
                        </div>

                        {/* Evaluators */}
                        <div className="flex flex-wrap gap-2">
                          {defense.evaluators.map((name, i) => (
                            <div key={i} className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${name === "Dr. David Martinez" ? "bg-violet-500/10 text-violet-600 border border-violet-300" : "bg-muted text-muted-foreground"}`}>
                              <div className={`h-1.5 w-1.5 rounded-full ${name === "Dr. David Martinez" ? "bg-violet-500" : "bg-muted-foreground"}`} />
                              {name}
                              {name === "Dr. David Martinez" && <span className="opacity-60">(you)</span>}
                            </div>
                          ))}
                        </div>

                        {defense.notes && (
                          <p className="text-xs text-muted-foreground italic bg-muted/30 rounded-lg px-3 py-2">
                            📝 {defense.notes}
                          </p>
                        )}

                        {/* Eval Status + Action */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <Badge className={`text-xs ${eConfig.color}`}>
                            <ClipboardCheck className="h-3 w-3 mr-1" />
                            {eConfig.label}
                          </Badge>
                          <Link href={`/dashboard/evaluator/evaluations/${defense.id}`}>
                            <Button size="sm" variant={defense.evaluationStatus === "pending" || defense.evaluationStatus === "in_progress" ? "default" : "outline"} className={`h-8 gap-1.5 text-xs ${defense.evaluationStatus === "pending" || defense.evaluationStatus === "in_progress" ? "btn-gradient" : ""}`}>
                              <ClipboardCheck className="h-3.5 w-3.5" />
                              {defense.evaluationStatus === "pending" ? "Start Evaluation" : defense.evaluationStatus === "in_progress" ? "Continue" : "View Evaluation"}
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
