"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Search,
  Filter,
  Users,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Eye,
  MessageSquare,
  Mail,
  GraduationCap,
  Calendar,
  Star,
  Activity,
  Lock,
  Target,
  UserCheck,
  UserPlus,
  Send,
  X,
  Info,
  LayoutGrid,
  List,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

/* ─── Types ────────────────────────────────────────────────────────────── */
type ProjectStatus = "on_track" | "at_risk" | "completed" | "overdue" | "not_started"

interface Activity {
  name: string
  progress: number
  status: "completed" | "in_progress" | "pending" | "locked"
}

interface Student {
  id: string
  name: string
  email: string
  phone: string
  avatar: string
  role: "leader" | "member"
  year: string
  tasksDone: number
  tasksTotal: number
  lastActive: string
  contribution: number
}

interface Project {
  id: string
  title: string
  groupName: string
  groupId: string
  status: ProjectStatus
  dueDate: string
  startDate: string
  completionPercent: number
  scheduleVariance: number
  domain: string
  advisor: string
  evaluator: string
  description: string
  students: Student[]
  activities: Activity[]
  submissionsCount: number
  grade?: number
}

/* ─── Mock Data ─────────────────────────────────────────────────────────── */
const MOCK_PROJECTS: Project[] = [
  {
    id: "p1",
    title: "AI-Powered Campus Navigation System",
    groupName: "Group Alpha",
    groupId: "g1",
    status: "at_risk",
    dueDate: "2024-12-14",
    startDate: "2024-06-01",
    completionPercent: 50,
    scheduleVariance: -32,
    domain: "AI / Machine Learning",
    advisor: "Dr. Sarah Williams",
    evaluator: "Prof. James Carter",
    description: "Developing an AI-driven indoor campus navigation system using computer vision and real-time positioning. The system aims to assist students and visitors in finding classrooms, labs, and facilities efficiently.",
    submissionsCount: 3,
    students: [
      { id: "s1", name: "Alex Johnson", email: "alex.j@uni.edu", phone: "+1 555-0101", avatar: "AJ", role: "leader", year: "Year 4", tasksDone: 12, tasksTotal: 18, lastActive: "2 hours ago", contribution: 38 },
      { id: "s2", name: "Maria Garcia", email: "maria.g@uni.edu", phone: "+1 555-0102", avatar: "MG", role: "member", year: "Year 4", tasksDone: 9, tasksTotal: 18, lastActive: "1 day ago", contribution: 32 },
      { id: "s3", name: "David Kim", email: "david.k@uni.edu", phone: "+1 555-0103", avatar: "DK", role: "member", year: "Year 3", tasksDone: 7, tasksTotal: 18, lastActive: "3 days ago", contribution: 30 },
    ],
    activities: [
      { name: "Requirements & Design", progress: 100, status: "completed" },
      { name: "Core Development", progress: 80,  status: "in_progress" },
      { name: "Testing & Validation", progress: 75, status: "in_progress" },
      { name: "Documentation", progress: 40, status: "in_progress" },
      { name: "Final Submission", progress: 0, status: "locked" },
    ],
  },
  {
    id: "p2",
    title: "Smart Energy Management Dashboard",
    groupName: "Group Beta",
    groupId: "g2",
    status: "on_track",
    dueDate: "2025-01-20",
    startDate: "2024-07-01",
    completionPercent: 72,
    scheduleVariance: 8,
    domain: "IoT / Sustainability",
    advisor: "Dr. Michael Brown",
    evaluator: "Prof. Linda Chen",
    description: "A real-time IoT dashboard for monitoring and optimising energy consumption across campus buildings. Integrates with existing BMS infrastructure to provide actionable insights.",
    submissionsCount: 5,
    students: [
      { id: "s4", name: "Emma Wilson", email: "emma.w@uni.edu", phone: "+1 555-0201", avatar: "EW", role: "leader", year: "Year 4", tasksDone: 22, tasksTotal: 26, lastActive: "30 min ago", contribution: 42 },
      { id: "s5", name: "James Lee", email: "james.l@uni.edu", phone: "+1 555-0202", avatar: "JL", role: "member", year: "Year 4", tasksDone: 18, tasksTotal: 26, lastActive: "4 hours ago", contribution: 35 },
      { id: "s6", name: "Sophie Turner", email: "sophie.t@uni.edu", phone: "+1 555-0203", avatar: "ST", role: "member", year: "Year 3", tasksDone: 14, tasksTotal: 26, lastActive: "1 day ago", contribution: 23 },
    ],
    activities: [
      { name: "Architecture Design", progress: 100, status: "completed" },
      { name: "Backend API", progress: 100, status: "completed" },
      { name: "Frontend Dashboard", progress: 85, status: "in_progress" },
      { name: "IoT Integration", progress: 60, status: "in_progress" },
      { name: "Testing", progress: 20, status: "in_progress" },
      { name: "Deployment", progress: 0, status: "locked" },
    ],
  },
  {
    id: "p3",
    title: "Blockchain-Based Student Credentials",
    groupName: "Group Gamma",
    groupId: "g3",
    status: "overdue",
    dueDate: "2024-11-30",
    startDate: "2024-05-15",
    completionPercent: 35,
    scheduleVariance: -48,
    domain: "Blockchain / Security",
    advisor: "Prof. Robert Chen",
    evaluator: "Dr. Alice Park",
    description: "A decentralised credential verification system using blockchain technology to issue, store, and verify academic certificates securely without a central authority.",
    submissionsCount: 2,
    students: [
      { id: "s7", name: "Noah Williams", email: "noah.w@uni.edu", phone: "+1 555-0301", avatar: "NW", role: "leader", year: "Year 4", tasksDone: 8, tasksTotal: 24, lastActive: "5 days ago", contribution: 35 },
      { id: "s8", name: "Olivia Martinez", email: "olivia.m@uni.edu", phone: "+1 555-0302", avatar: "OM", role: "member", year: "Year 4", tasksDone: 6, tasksTotal: 24, lastActive: "1 week ago", contribution: 40 },
      { id: "s9", name: "Ethan Brown", email: "ethan.b@uni.edu", phone: "+1 555-0303", avatar: "EB", role: "member", year: "Year 3", tasksDone: 5, tasksTotal: 24, lastActive: "2 weeks ago", contribution: 25 },
    ],
    activities: [
      { name: "Research & Proposal", progress: 100, status: "completed" },
      { name: "Smart Contract Dev", progress: 60,  status: "in_progress" },
      { name: "Frontend Interface", progress: 15, status: "in_progress" },
      { name: "Security Audit", progress: 0, status: "locked" },
      { name: "Final Submission", progress: 0, status: "locked" },
    ],
  },
  {
    id: "p4",
    title: "Mental Health Chatbot for Students",
    groupName: "Group Delta",
    groupId: "g4",
    status: "completed",
    dueDate: "2024-12-01",
    startDate: "2024-04-01",
    completionPercent: 100,
    scheduleVariance: 5,
    domain: "NLP / Health Tech",
    advisor: "Dr. Sarah Williams",
    evaluator: "Prof. James Carter",
    description: "An empathetic conversational AI system that provides initial mental health support, coping strategies, and crisis escalation pathways for university students.",
    submissionsCount: 7,
    grade: 88,
    students: [
      { id: "s10", name: "Ava Thompson", email: "ava.t@uni.edu", phone: "+1 555-0401", avatar: "AT", role: "leader", year: "Year 4", tasksDone: 30, tasksTotal: 30, lastActive: "1 week ago", contribution: 40 },
      { id: "s11", name: "Liam Harris", email: "liam.h@uni.edu", phone: "+1 555-0402", avatar: "LH", role: "member", year: "Year 4", tasksDone: 30, tasksTotal: 30, lastActive: "1 week ago", contribution: 35 },
      { id: "s12", name: "Mia Clark", email: "mia.c@uni.edu", phone: "+1 555-0403", avatar: "MC", role: "member", year: "Year 3", tasksDone: 30, tasksTotal: 30, lastActive: "1 week ago", contribution: 25 },
    ],
    activities: [
      { name: "Requirements", progress: 100, status: "completed" },
      { name: "NLP Model Training", progress: 100, status: "completed" },
      { name: "Frontend App", progress: 100, status: "completed" },
      { name: "Integration Testing", progress: 100, status: "completed" },
      { name: "Final Submission", progress: 100, status: "completed" },
    ],
  },
  {
    id: "p5",
    title: "Automated Lab Scheduling System",
    groupName: "Group Epsilon",
    groupId: "g5",
    status: "on_track",
    dueDate: "2025-02-28",
    startDate: "2024-09-01",
    completionPercent: 45,
    scheduleVariance: 3,
    domain: "Software Engineering",
    advisor: "Prof. Robert Chen",
    evaluator: "Dr. Alice Park",
    description: "A constraint-based optimisation system for automatic scheduling of computer labs, taking into account course requirements, equipment availability, and student preferences.",
    submissionsCount: 2,
    students: [
      { id: "s13", name: "Lucas Anderson", email: "lucas.a@uni.edu", phone: "+1 555-0501", avatar: "LA", role: "leader", year: "Year 3", tasksDone: 14, tasksTotal: 32, lastActive: "6 hours ago", contribution: 45 },
      { id: "s14", name: "Isabella Lewis", email: "isabella.l@uni.edu", phone: "+1 555-0502", avatar: "IL", role: "member", year: "Year 3", tasksDone: 11, tasksTotal: 32, lastActive: "2 days ago", contribution: 30 },
      { id: "s15", name: "Mason Scott", email: "mason.s@uni.edu", phone: "+1 555-0503", avatar: "MS", role: "member", year: "Year 3", tasksDone: 9, tasksTotal: 32, lastActive: "3 days ago", contribution: 25 },
    ],
    activities: [
      { name: "System Design", progress: 100, status: "completed" },
      { name: "Algorithm Development", progress: 70, status: "in_progress" },
      { name: "Backend API", progress: 40, status: "in_progress" },
      { name: "Frontend", progress: 0, status: "locked" },
      { name: "Testing & QA", progress: 0, status: "locked" },
      { name: "Documentation", progress: 0, status: "locked" },
    ],
  },
]

/* ─── Config ─────────────────────────────────────────────────────────── */
const STATUS_CFG: Record<ProjectStatus, { label: string; cls: string; dot: string; icon: React.ElementType }> = {
  on_track:    { label: "On Track",    cls: "bg-primary/10 text-primary border-primary/20",          dot: "bg-primary",       icon: CheckCircle2 },
  at_risk:     { label: "At Risk",     cls: "bg-amber-500/10 text-amber-600 border-amber-400/30",    dot: "bg-amber-500",     icon: AlertTriangle },
  completed:   { label: "Completed",   cls: "bg-primary/10 text-primary border-primary/20",          dot: "bg-primary",       icon: CheckCircle2 },
  overdue:     { label: "Overdue",     cls: "bg-destructive/10 text-destructive border-destructive/20", dot: "bg-destructive", icon: AlertTriangle },
  not_started: { label: "Not Started", cls: "bg-muted text-muted-foreground border-border",          dot: "bg-muted-foreground", icon: Clock },
}

const ACTIVITY_CFG = {
  completed:   { cls: "bg-primary/10 text-primary",               dot: "bg-primary" },
  in_progress: { cls: "bg-amber-500/10 text-amber-600",           dot: "bg-amber-500" },
  pending:     { cls: "bg-muted text-muted-foreground",           dot: "bg-muted-foreground" },
  locked:      { cls: "bg-muted/50 text-muted-foreground/60",     dot: "bg-muted-foreground/30" },
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */
function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.round(diff / 86400000)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function initials(name: string) {
  return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2)
}

/* ─── Activity Item ─────────────────────────────────────────────────── */
function ActivityItem({ act }: { act: Activity }) {
  const cfg = ACTIVITY_CFG[act.status]
  const isLocked = act.status === "locked"
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0">
      <div className={cn("h-6 w-6 rounded-md flex items-center justify-center shrink-0", isLocked ? "bg-muted/50" : "bg-muted")}>
        {isLocked ? <Lock className="h-3 w-3 text-muted-foreground/40" /> : <Activity className="h-3 w-3 text-muted-foreground" />}
      </div>
      <span className={cn("flex-1 text-sm font-medium truncate", isLocked && "text-muted-foreground/60")}>{act.name}</span>
      <div className="flex items-center gap-2 shrink-0">
        <span className={cn("text-xs font-semibold tabular-nums", isLocked ? "text-muted-foreground/40" : act.progress === 100 ? "text-primary" : "text-foreground")}>
          {act.progress}%
        </span>
        <div className={cn("h-2 w-2 rounded-full", cfg.dot)} />
      </div>
    </div>
  )
}

/* ─── Project Card (matches screenshot style) ───────────────────────── */
function ProjectCard({ project, onView }: { project: Project; onView: () => void }) {
  const sc = STATUS_CFG[project.status]
  const StatusIcon = sc.icon
  const days = daysUntil(project.dueDate)
  const overdue = days < 0
  const timeLabel = overdue ? `${Math.abs(days)} days overdue` : days === 0 ? "Due today" : `${days} days left`

  return (
    <Card className="group border border-border/60 hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Top stripe by status */}
      <div className={cn("h-1 w-full", project.status === "on_track" ? "bg-primary" : project.status === "completed" ? "bg-primary/60" : project.status === "overdue" ? "bg-destructive" : "bg-amber-500")} />

      <CardContent className="p-5 space-y-4">
        {/* Title + Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[0.95rem] leading-snug mb-1 group-hover:text-primary transition-colors">{project.title}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> {project.groupName} · {project.domain}
            </p>
          </div>
          <Badge variant="outline" className={cn("text-xs shrink-0 flex items-center gap-1", sc.cls)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />
            {sc.label}
          </Badge>
        </div>

        {/* Due date row */}
        <div className="flex items-center justify-between text-xs bg-muted/40 rounded-lg px-3 py-2">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Due: {fmtDate(project.dueDate)}
          </span>
          <span className={cn("flex items-center gap-1 font-medium", overdue ? "text-destructive" : project.scheduleVariance < 0 ? "text-amber-600" : "text-primary")}>
            {overdue || project.scheduleVariance < 0 ? <AlertTriangle className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
            {timeLabel}
          </span>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border", sc.cls)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />
                {sc.label}
              </span>
            </div>
            <span className="text-xs font-semibold text-foreground">{project.completionPercent}% complete</span>
          </div>
          <Progress
            value={project.completionPercent}
            className="h-2.5 rounded-full"
          />
          <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
            <span>Start</span>
            {project.scheduleVariance !== 0 && (
              <span className={cn("font-medium", project.scheduleVariance < 0 ? "text-amber-600" : "text-primary")}>
                {project.scheduleVariance < 0 ? `${Math.abs(project.scheduleVariance)}% behind` : `${project.scheduleVariance}% ahead`}
              </span>
            )}
            <span>Deadline</span>
          </div>
        </div>

        {/* Upcoming Activities */}
        <div>
          <div className="flex items-center gap-1.5 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <TrendingUp className="h-3 w-3" /> Upcoming Activities
          </div>
          <div className="rounded-lg border border-border/50 px-3 overflow-hidden">
            {project.activities.slice(0, 3).map(act => (
              <ActivityItem key={act.name} act={act} />
            ))}
          </div>
          {project.activities.length > 3 && (
            <p className="text-xs text-muted-foreground mt-1.5 text-center">+{project.activities.length - 3} more activities</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <div className="flex -space-x-2">
            {project.students.map(s => (
              <Avatar key={s.id} className="h-6 w-6 border-2 border-background">
                <AvatarFallback className="text-[9px] bg-primary/10 text-primary">{s.avatar}</AvatarFallback>
              </Avatar>
            ))}
            <span className="ml-2.5 text-xs text-muted-foreground self-center">{project.students.length} students</span>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors" onClick={onView}>
            <Eye className="h-3 w-3" /> View Detail
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Student Row (in detail sheet) ─────────────────────────────────── */
function StudentRow({ student, onChat, onEmail }: { student: Student; onChat: () => void; onEmail: () => void }) {
  const pct = Math.round((student.tasksDone / student.tasksTotal) * 100)
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">{student.avatar}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{student.name}</span>
            {student.role === "leader" && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-primary/5 text-primary border-primary/20">
                <Star className="h-2.5 w-2.5 mr-0.5" /> Leader
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{student.email} · {student.year}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10" title="Chat" onClick={onChat}>
            <MessageSquare className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10" title="Email" onClick={onEmail}>
            <Mail className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg bg-muted/50 py-1.5">
          <p className="text-sm font-bold">{student.tasksDone}/{student.tasksTotal}</p>
          <p className="text-[10px] text-muted-foreground">Tasks Done</p>
        </div>
        <div className="rounded-lg bg-muted/50 py-1.5">
          <p className="text-sm font-bold">{student.contribution}%</p>
          <p className="text-[10px] text-muted-foreground">Contribution</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Task Progress</span>
          <span className="font-medium">{pct}%</span>
        </div>
        <Progress value={pct} className="h-1.5" />
      </div>

      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        <Activity className="h-3 w-3" /> Last active {student.lastActive}
      </p>
    </div>
  )
}

/* ─── Project Detail Sheet ───────────────────────────────────────────── */
function ProjectDetailSheet({
  project,
  open,
  onClose,
}: {
  project: Project | null
  open: boolean
  onClose: () => void
}) {
  const [chatOpen, setChatOpen]     = useState(false)
  const [chatStudent, setChatStudent] = useState<Student | null>(null)
  const [chatMsg, setChatMsg]       = useState("")
  const [sending, setSending]       = useState(false)

  const handleChat = (s: Student) => { setChatStudent(s); setChatOpen(true) }

  const handleEmail = (s: Student) => {
    window.open(`mailto:${s.email}?subject=Re: ${project?.title}`)
    toast.success("Email client opened", { description: `Composing to ${s.name}` })
  }

  const handleSend = async () => {
    if (!chatMsg.trim()) return
    setSending(true)
    await new Promise(r => setTimeout(r, 600))
    setSending(false)
    toast.success(`Message sent to ${chatStudent?.name}`)
    setChatMsg("")
    setChatOpen(false)
  }

  if (!project) return null

  const sc = STATUS_CFG[project.status]
  const days = daysUntil(project.dueDate)
  const overdue = days < 0

  return (
    <>
      <Sheet open={open} onOpenChange={v => !v && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
          <SheetHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="outline" className={cn("text-xs", sc.cls)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full mr-1", sc.dot)} />
                    {sc.label}
                  </Badge>
                  <Badge variant="outline" className="text-xs text-muted-foreground">{project.domain}</Badge>
                </div>
                <SheetTitle className="text-base leading-tight">{project.title}</SheetTitle>
                <SheetDescription className="text-xs mt-0.5">{project.groupName} · {project.students.length} students</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="p-6 space-y-6">
            <Tabs defaultValue="overview">
              <TabsList className="h-auto w-full justify-start overflow-x-auto whitespace-nowrap">
                <TabsTrigger value="overview" className="text-xs shrink-0">Overview</TabsTrigger>
                <TabsTrigger value="students" className="text-xs shrink-0">Students</TabsTrigger>
                <TabsTrigger value="activities" className="text-xs shrink-0">Activities</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-4 space-y-4">
                {/* Description */}
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Description</p>
                  <p className="text-sm text-foreground leading-relaxed">{project.description}</p>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border bg-card p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Progress</p>
                    <p className="text-2xl font-bold text-primary">{project.completionPercent}%</p>
                    <Progress value={project.completionPercent} className="h-1.5 mt-2" />
                  </div>
                  <div className="rounded-xl border bg-card p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Schedule</p>
                    <p className={cn("text-2xl font-bold", overdue ? "text-destructive" : project.scheduleVariance < 0 ? "text-amber-600" : "text-primary")}>
                      {overdue ? `${Math.abs(days)}d` : project.scheduleVariance < 0 ? `${Math.abs(project.scheduleVariance)}%` : `+${project.scheduleVariance}%`}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">{overdue ? "days overdue" : project.scheduleVariance < 0 ? "behind schedule" : "ahead of schedule"}</p>
                  </div>
                  <div className="rounded-xl border bg-card p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Submissions</p>
                    <p className="text-2xl font-bold">{project.submissionsCount}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">documents submitted</p>
                  </div>
                  {project.grade && (
                    <div className="rounded-xl border bg-card p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Final Grade</p>
                      <p className="text-2xl font-bold text-primary">{project.grade}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">out of 100</p>
                    </div>
                  )}
                  {!project.grade && (
                    <div className="rounded-xl border bg-card p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Due Date</p>
                      <p className="text-sm font-bold">{fmtDate(project.dueDate)}</p>
                      <p className={cn("text-[10px] mt-1", overdue ? "text-destructive" : "text-muted-foreground")}>
                        {overdue ? `${Math.abs(days)} days overdue` : `${days} days remaining`}
                      </p>
                    </div>
                  )}
                </div>

                {/* People */}
                <div className="rounded-xl border bg-muted/20 p-4 space-y-2.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">People</p>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Advisor</p>
                      <p className="text-sm font-medium">{project.advisor}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Evaluator</p>
                      <p className="text-sm font-medium">{project.evaluator}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Students Tab */}
              <TabsContent value="students" className="mt-4 space-y-3">
                <p className="text-xs text-muted-foreground">{project.students.length} students in this group</p>
                {project.students.map(s => (
                  <StudentRow
                    key={s.id}
                    student={s}
                    onChat={() => handleChat(s)}
                    onEmail={() => handleEmail(s)}
                  />
                ))}
              </TabsContent>

              {/* Activities Tab */}
              <TabsContent value="activities" className="mt-4">
                <div className="rounded-xl border overflow-hidden">
                  <div className="px-4 py-3 bg-muted/30 border-b flex items-center justify-between">
                    <p className="text-xs font-semibold">{project.activities.length} Total Activities</p>
                    <p className="text-xs text-muted-foreground">
                      {project.activities.filter(a => a.status === "completed").length} completed
                    </p>
                  </div>
                  <div className="px-4 divide-y divide-border/40">
                    {project.activities.map((act, i) => (
                      <div key={act.name} className="py-3 flex items-center gap-3">
                        <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                          act.status === "completed" ? "bg-primary/10 text-primary" : act.status === "locked" ? "bg-muted/50 text-muted-foreground/40" : "bg-amber-500/10 text-amber-600")}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-medium", act.status === "locked" && "text-muted-foreground/60")}>{act.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={act.progress} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{act.progress}%</span>
                          </div>
                        </div>
                        <div className={cn("h-2 w-2 rounded-full shrink-0", ACTIVITY_CFG[act.status].dot)} />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={v => !v && setChatOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">{chatStudent?.avatar}</AvatarFallback>
              </Avatar>
              {chatStudent?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">Send a message about <span className="font-medium text-foreground">{project.title}</span></DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <Textarea
              placeholder={`Hi ${chatStudent?.name?.split(" ")[0]}, I wanted to follow up on…`}
              value={chatMsg}
              onChange={e => setChatMsg(e.target.value)}
              className="resize-none min-h-[100px] text-sm"
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setChatOpen(false)}>Cancel</Button>
              <Button className="flex-1 gap-2" disabled={sending || !chatMsg.trim()} onClick={handleSend}>
                {sending ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

/* ─── All-Students Card ─────────────────────────────────────────────── */
function AllStudentCard({ student, project, onChat, onEmail }: {
  student: Student
  project: Project
  onChat: () => void
  onEmail: () => void
}) {
  const sc = STATUS_CFG[project.status]
  const pct = Math.round((student.tasksDone / student.tasksTotal) * 100)
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3 hover:border-primary/30 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">{student.avatar}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{student.name}</span>
            {student.role === "leader" && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-primary/5 text-primary border-primary/20">
                <Star className="h-2.5 w-2.5 mr-0.5" />Leader
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{student.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {project.title}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-primary/10 hover:text-primary" title="Chat" onClick={onChat}>
            <MessageSquare className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-primary/10 hover:text-primary" title="Email" onClick={onEmail}>
            <Mail className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="rounded-lg bg-muted/50 py-1.5">
          <p className="text-xs font-bold">{pct}%</p>
          <p className="text-[9px] text-muted-foreground">Tasks</p>
        </div>
        <div className="rounded-lg bg-muted/50 py-1.5">
          <p className="text-xs font-bold">{student.contribution}%</p>
          <p className="text-[9px] text-muted-foreground">Contrib</p>
        </div>
        <div className="rounded-lg bg-muted/50 py-1.5">
          <p className={cn("text-xs font-bold", sc.cls.split(" ")[1])}>{sc.label.split(" ")[0]}</p>
          <p className="text-[9px] text-muted-foreground">Status</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Progress value={pct} className="flex-1 h-1.5" />
        <span className="text-[10px] text-muted-foreground shrink-0">{student.tasksDone}/{student.tasksTotal} tasks</span>
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><Activity className="h-2.5 w-2.5" />Active {student.lastActive}</span>
        <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5" />{project.groupName}</span>
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function GroupsPage() {
  const [search, setSearch]         = useState("")
  const [statusFilter, setStatus]   = useState("all")
  const [domainFilter, setDomain]   = useState("all")
  const [selected, setSelected]     = useState<Project | null>(null)
  const [sheetOpen, setSheetOpen]   = useState(false)

  const [stuView, setStuView]       = useState<"grid" | "table">("grid")
  const [stuSearch, setStuSearch]   = useState("")

  /* Chat / email from students tab */
  const [chatOpen2, setChatOpen2]   = useState(false)
  const [chatStu2, setChatStu2]     = useState<{ student: Student; project: Project } | null>(null)
  const [chatMsg2, setChatMsg2]     = useState("")
  const [sending2, setSending2]     = useState(false)

  const domains = useMemo(() => Array.from(new Set(MOCK_PROJECTS.map(p => p.domain))), [])

  const filtered = useMemo(() => MOCK_PROJECTS.filter(p => {
    const q = search.toLowerCase()
    const mS = !search || p.title.toLowerCase().includes(q) || p.groupName.toLowerCase().includes(q) || p.domain.toLowerCase().includes(q)
    const mSt = statusFilter === "all" || p.status === statusFilter
    const mD  = domainFilter === "all" || p.domain === domainFilter
    return mS && mSt && mD
  }), [search, statusFilter, domainFilter])

  const allStudents: { student: Student; project: Project }[] = useMemo(
    () => MOCK_PROJECTS.flatMap(p => p.students.map(s => ({ student: s, project: p }))),
    []
  )

  const kpi = [
    { label: "Total Groups",  value: MOCK_PROJECTS.length,                                          icon: BookOpen,      bg: "bg-primary/10",        color: "text-primary" },
    { label: "On Track",      value: MOCK_PROJECTS.filter(p => p.status === "on_track").length,    icon: CheckCircle2,  bg: "bg-primary/10",        color: "text-primary" },
    { label: "At Risk",       value: MOCK_PROJECTS.filter(p => p.status === "at_risk").length,     icon: AlertTriangle, bg: "bg-amber-500/10",      color: "text-amber-600" },
    { label: "Overdue",       value: MOCK_PROJECTS.filter(p => p.status === "overdue").length,     icon: TrendingDown,  bg: "bg-destructive/10",    color: "text-destructive" },
    { label: "Completed",     value: MOCK_PROJECTS.filter(p => p.status === "completed").length,   icon: Star,          bg: "bg-primary/10",        color: "text-primary" },
    { label: "Total Students",value: allStudents.length,                                            icon: Users,         bg: "bg-muted",             color: "text-foreground" },
  ]

  const openDetail = (p: Project) => { setSelected(p); setSheetOpen(true) }

  const handleStudentChat = async () => {
    if (!chatMsg2.trim() || !chatStu2) return
    setSending2(true)
    await new Promise(r => setTimeout(r, 600))
    setSending2(false)
    toast.success(`Message sent to ${chatStu2.student.name}`)
    setChatMsg2("")
    setChatOpen2(false)
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/coordinator">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Groups & Projects
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitor all project groups, track progress, and coordinate with students
            </p>
          </div>
        </div>
        <div className="pl-11 sm:pl-0 flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-xs">
            {MOCK_PROJECTS.length} groups
          </Badge>
          <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
            {allStudents.length} students
          </Badge>
          <Link href="/dashboard/coordinator/groups/applications">
            <Button size="sm" className="gap-1.5 h-8 text-xs">
              <UserPlus className="h-3.5 w-3.5" /> Group Leader Applications
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {kpi.map(s => (
          <Card key={s.label} className="group border-none shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", s.bg)}>
                <s.icon className={cn("h-4 w-4", s.color)} />
              </div>
              <div>
                <p className="text-xl font-bold leading-none">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Page Tabs */}
      <Tabs defaultValue="projects">
        <TabsList className="h-auto w-full justify-start overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="projects" className="gap-1.5 shrink-0 text-sm">
            <BookOpen className="h-4 w-4" /> All Projects
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-1.5 shrink-0 text-sm">
            <GraduationCap className="h-4 w-4" /> All Students
          </TabsTrigger>
        </TabsList>

        {/* ── Projects Tab ── */}
        <TabsContent value="projects" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by title, group, or domain…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatus}>
              <SelectTrigger className="h-10 w-40 shrink-0">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="on_track">On Track</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
              </SelectContent>
            </Select>
            <Select value={domainFilter} onValueChange={setDomain}>
              <SelectTrigger className="h-10 w-44 shrink-0">
                <Target className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {domains.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            {(search || statusFilter !== "all" || domainFilter !== "all") && (
              <Button variant="ghost" size="sm" className="h-10 shrink-0 text-xs"
                onClick={() => { setSearch(""); setStatus("all"); setDomain("all") }}>
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>

          {/* Results count */}
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {MOCK_PROJECTS.length} projects
          </p>

          {/* Cards Grid */}
          {filtered.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map(p => (
                <ProjectCard key={p.id} project={p} onView={() => openDetail(p)} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="font-medium text-muted-foreground">No projects found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </TabsContent>

        {/* ── Students Tab ── */}
        <TabsContent value="students" className="mt-4 space-y-4">
          {/* Controls row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students by name, email, or group…"
                value={stuSearch}
                onChange={e => setStuSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            {stuSearch && (
              <Button variant="ghost" size="sm" className="h-10 shrink-0 text-xs"
                onClick={() => setStuSearch("")}>
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
            {/* View toggle */}
            <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1 shrink-0">
              <Button
                variant={stuView === "grid" ? "default" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setStuView("grid")}
                title="Grid view"
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={stuView === "table" ? "default" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setStuView("table")}
                title="Table view"
                aria-label="Table view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Results summary */}
          {(() => {
            const filtered2 = allStudents.filter(({ student, project }) => {
              const q = stuSearch.toLowerCase()
              return !stuSearch || student.name.toLowerCase().includes(q) || student.email.toLowerCase().includes(q) || project.groupName.toLowerCase().includes(q)
            })
            return (
              <>
                <p className="text-xs text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filtered2.length}</span> of {allStudents.length} students
                </p>

                {stuView === "grid" ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {filtered2.map(({ student, project }) => (
                      <AllStudentCard
                        key={student.id}
                        student={student}
                        project={project}
                        onChat={() => { setChatStu2({ student, project }); setChatOpen2(true) }}
                        onEmail={() => {
                          window.open(`mailto:${student.email}?subject=Re: ${project.title}`)
                          toast.success("Email client opened", { description: `Composing to ${student.name}` })
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  /* Table view */
                  <div className="rounded-xl border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/40">
                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">Student</th>
                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">Email</th>
                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">Group</th>
                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">Task Progress</th>
                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">Contribution</th>
                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">Project Status</th>
                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">Last Active</th>
                            <th className="text-right px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {filtered2.map(({ student, project }) => {
                            const pct2 = Math.round((student.tasksDone / student.tasksTotal) * 100)
                            const sc2 = STATUS_CFG[project.status]
                            return (
                              <tr key={student.id} className="hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <Avatar className="h-8 w-8 shrink-0">
                                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">{student.avatar}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="font-medium text-sm leading-tight truncate max-w-[140px]">{student.name}</p>
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <span className="text-[10px] text-muted-foreground">{student.year}</span>
                                        {student.role === "leader" && (
                                          <Badge variant="outline" className="text-[9px] h-3.5 px-1 bg-primary/5 text-primary border-primary/20 leading-none">
                                            Leader
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs text-muted-foreground">{student.email}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium">{project.groupName}</p>
                                    <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{project.domain}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2 min-w-[120px]">
                                    <Progress value={pct2} className="flex-1 h-1.5" />
                                    <span className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">{student.tasksDone}/{student.tasksTotal}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs font-semibold">{student.contribution}%</span>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant="outline" className={cn("text-xs", sc2.cls)}>
                                    <span className={cn("h-1.5 w-1.5 rounded-full mr-1", sc2.dot)} />
                                    {sc2.label}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">{student.lastActive}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button size="icon" variant="ghost"
                                      className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                                      title="Chat"
                                      onClick={() => { setChatStu2({ student, project }); setChatOpen2(true) }}>
                                      <MessageSquare className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost"
                                      className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                                      title="Email"
                                      onClick={() => {
                                        window.open(`mailto:${student.email}?subject=Re: ${project.title}`)
                                        toast.success("Email client opened", { description: `Composing to ${student.name}` })
                                      }}>
                                      <Mail className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    {filtered2.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <GraduationCap className="h-8 w-8 text-muted-foreground/30 mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">No students found</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Try adjusting your search</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )
          })()}
        </TabsContent>
      </Tabs>

      {/* Project Detail Sheet */}
      <ProjectDetailSheet project={selected} open={sheetOpen} onClose={() => setSheetOpen(false)} />

      {/* Students Tab Chat Dialog */}
      <Dialog open={chatOpen2} onOpenChange={v => !v && setChatOpen2(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">{chatStu2?.student.avatar}</AvatarFallback>
              </Avatar>
              {chatStu2?.student.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Re: <span className="font-medium text-foreground">{chatStu2?.project.title}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <Textarea
              placeholder={`Hi ${chatStu2?.student.name.split(" ")[0]}, I wanted to follow up on…`}
              value={chatMsg2}
              onChange={e => setChatMsg2(e.target.value)}
              className="resize-none min-h-[100px] text-sm"
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setChatOpen2(false)}>Cancel</Button>
              <Button className="flex-1 gap-2" disabled={sending2 || !chatMsg2.trim()} onClick={handleStudentChat}>
                {sending2 ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
