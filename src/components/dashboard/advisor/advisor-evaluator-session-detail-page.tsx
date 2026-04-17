"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle,
  ClipboardCheck,
  Clock,
  Download,
  FileText,
  Crosshair,
  LayoutDashboard,
  MapPin,
  Timer,
  Users,
  Video,
} from "lucide-react"

import PageHeader from "@/components/shared/PageHeader"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

import { RUBRIC_TOTAL_MAX_PERCENT } from "./advisor-evaluator-shared"
import {
  getScheduledSessionById,
  type ScheduledSessionDetail,
  type ScheduledSessionStatus,
  type ScheduledSessionType,
} from "./advisor-evaluator-scheduled-data"

function formatLongDate(dateString: string) {
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return dateString
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function statusBadgeClass(status: ScheduledSessionStatus) {
  switch (status) {
    case "upcoming":
      return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400"
    case "in-progress":
      return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-400"
    case "completed":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400"
    case "cancelled":
      return "border-destructive/30 bg-destructive/10 text-destructive"
    default:
      return ""
  }
}

function SessionStatusBadge({ status }: { status: ScheduledSessionStatus }) {
  return (
    <Badge variant="outline" className={cn("capitalize", statusBadgeClass(status))}>
      {status.replace("-", " ")}
    </Badge>
  )
}

function TypeBadge({ type }: { type: ScheduledSessionType }) {
  if (type === "virtual") {
    return (
      <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
        Virtual
      </Badge>
    )
  }
  return <Badge variant="outline">In person</Badge>
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function AdvisorEvaluatorSessionDetailPage({ sessionId }: { sessionId: string }) {
  const session = React.useMemo(() => getScheduledSessionById(sessionId), [sessionId])

  if (!session) {
    return (
      <div className="flex w-full min-w-0 flex-col items-center gap-4 py-16 text-center animate-in fade-in">
        <AlertCircle className="h-12 w-12 text-muted-foreground" aria-hidden />
        <div>
          <h1 className="text-xl font-semibold">Session not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            No session with id <span className="font-mono">{sessionId}</span>.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/advisor/evaluator/scheduled">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Back to sessions
          </Link>
        </Button>
      </div>
    )
  }

  return <SessionDetailContent session={session} />
}

function SessionDetailContent({ session }: { session: ScheduledSessionDetail }) {
  const criteriaWeightTotal = React.useMemo(
    () => session.evaluationCriteria.reduce((s, c) => s + c.weight, 0),
    [session.evaluationCriteria],
  )

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 pb-10 animate-in fade-in duration-300 sm:gap-8 lg:gap-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Button variant="outline" size="sm" className="w-fit gap-2" asChild>
          <Link href="/dashboard/advisor/evaluator/scheduled">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to sessions
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href="/dashboard/advisor/evaluator">
              <LayoutDashboard className="h-4 w-4" aria-hidden />
              Evaluator hub
            </Link>
          </Button>
          <Button variant="default" size="sm" className="btn-gradient gap-2 shadow-md shadow-primary/20" asChild>
            <Link href="/dashboard/advisor/evaluator/rubric">
              <BookOpen className="h-4 w-4" aria-hidden />
              Rubric
            </Link>
          </Button>
        </div>
      </div>

      <PageHeader
        title={session.project}
        description={`${session.group} · ${formatLongDate(session.date)} · ${session.time} · ${session.duration}`}
      />

      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.07] via-background to-background shadow-md shadow-primary/[0.06]">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex flex-wrap items-center gap-2">
              <SessionStatusBadge status={session.status} />
              <TypeBadge type={session.type} />
              <Badge variant="secondary" className="font-normal">
                {session.evaluator}
              </Badge>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {session.type === "virtual" ? (
                <Button
                  type="button"
                  className="btn-gradient h-11 gap-2 shadow-md shadow-primary/20 sm:h-10"
                  onClick={() =>
                    toast.message("Join virtual session", {
                      description: "Connect your calendar or video provider to surface a live link here.",
                    })
                  }
                >
                  <Video className="h-4 w-4" aria-hidden />
                  Join virtual session
                </Button>
              ) : null}
              <Button variant="outline" className="h-11 gap-2 sm:h-10" asChild>
                <Link href="/dashboard/advisor/evaluator/pending">
                  <ClipboardCheck className="h-4 w-4" aria-hidden />
                  Open pending queue
                </Link>
              </Button>
            </div>
          </div>
          <Separator className="my-5 bg-border/60" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex gap-3 rounded-xl border border-border/50 bg-background/60 p-3">
              <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">When</p>
                <p className="mt-0.5 font-medium leading-snug text-foreground">{session.time}</p>
                <p className="text-muted-foreground">{session.duration}</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-border/50 bg-background/60 p-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Where</p>
                <p className="mt-0.5 font-medium leading-snug text-foreground">{session.venue}</p>
                <p className="text-muted-foreground">
                  {session.type === "virtual" ? "Online" : "On campus"}
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-border/50 bg-background/60 p-3">
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Team</p>
                <p className="mt-0.5 font-medium leading-snug text-foreground">
                  {session.teamMembers.length} member{session.teamMembers.length === 1 ? "" : "s"}
                </p>
                <p className="truncate text-muted-foreground">{session.group}</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-border/50 bg-background/60 p-3">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Materials</p>
                <p className="mt-0.5 font-medium leading-snug text-foreground">{session.documents.length} file{session.documents.length === 1 ? "" : "s"}</p>
                <p className="text-muted-foreground">Listed below</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="min-w-0 space-y-6">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/10">
              <CardTitle className="text-lg">Session brief</CardTitle>
              <CardDescription>Context for this evaluation meeting.</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <p className="text-sm leading-relaxed text-muted-foreground">{session.description}</p>
            </CardContent>
          </Card>

          <section
            aria-label="Facilitation quick reference"
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 sm:p-5">
              <p className="text-sm font-semibold text-foreground">Session weights vs program rubric</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Percentages below “Session evaluation focus” steer discussion time. Official scores use the{" "}
                {RUBRIC_TOTAL_MAX_PERCENT}% form after the meeting.
              </p>
              <Button variant="secondary" size="sm" className="mt-4 w-full rounded-lg" asChild>
                <Link href="/dashboard/advisor/evaluator/rubric">
                  <BookOpen className="mr-2 h-4 w-4" aria-hidden />
                  Program rubric
                </Link>
              </Button>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5 sm:col-span-2 xl:col-span-1">
              <div className="flex items-center gap-2 text-primary">
                <Crosshair className="h-4 w-4 shrink-0" aria-hidden />
                <p className="text-sm font-semibold text-foreground">Capture live</p>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Timestamp demo hits/misses for rubric comments later.</li>
                <li>Q&amp;A: who answered, and does it match their docs?</li>
                <li>If they leave the agenda, note it—score what happened.</li>
              </ul>
            </div>
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:col-span-2 xl:col-span-1">
              <div>
                <p className="text-sm font-semibold text-foreground">Logistics</p>
                <dl className="mt-3 space-y-3 text-sm">
                  <div className="flex gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Venue / link</dt>
                      <dd className="text-muted-foreground">{session.venue}</dd>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Timer className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Timebox</dt>
                      <dd className="text-muted-foreground">{session.duration}</dd>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lead</dt>
                      <dd className="text-muted-foreground">{session.evaluator}</dd>
                    </div>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/10">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" aria-hidden />
                Agenda
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <ol className="space-y-3">
                {session.agenda.map((item, index) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/15 p-3 sm:p-4"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-sm font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="pt-1 text-sm font-medium leading-relaxed">{item}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/10">
              <CardTitle className="text-lg">Team members</CardTitle>
              <CardDescription>Presenting team for this session.</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {session.teamMembers.map((member) => (
                  <div
                    key={member.name}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 transition-colors hover:border-primary/20"
                  >
                    <Avatar className="h-11 w-11 border border-border/60">
                      {member.avatar ? <AvatarImage src={member.avatar} alt="" /> : null}
                      <AvatarFallback className="text-xs font-semibold">{initials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/10">
              <CardTitle className="text-lg">Session documents</CardTitle>
              <CardDescription>Files shared for this meeting (demo — connect storage for downloads).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              {session.documents.map((doc) => (
                <div
                  key={doc.name}
                  className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/15 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0">
                      <p className="font-medium leading-snug">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.size} · Uploaded {doc.uploadedAt}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 shrink-0"
                    onClick={() =>
                      toast.message("Download", { description: `${doc.name} — connect storage API.` })
                    }
                  >
                    <Download className="mr-2 h-4 w-4" aria-hidden />
                    Download
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/10">
              <CardTitle className="text-lg">Session evaluation focus</CardTitle>
              <CardDescription>
                Weights for discussion during this session (formal scoring uses the shared {RUBRIC_TOTAL_MAX_PERCENT}%
                rubric).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {session.evaluationCriteria.map((c) => (
                  <div key={c.name} className="space-y-2 rounded-xl border border-border/70 bg-card/50 p-4">
                    <div className="flex flex-wrap items-end justify-between gap-2">
                      <h4 className="font-semibold leading-snug">{c.name}</h4>
                      <span className="tabular-nums text-sm font-bold text-primary">{c.weight}%</span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{c.description}</p>
                    <Progress
                      value={criteriaWeightTotal > 0 ? (c.weight / criteriaWeightTotal) * 100 : 0}
                      className="h-2.5 bg-muted/80"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-primary/25 bg-gradient-to-br from-primary/[0.05] to-card shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">After this session</CardTitle>
              <CardDescription>
                Submit structured scores from the pending queue using the {RUBRIC_TOTAL_MAX_PERCENT}% evaluation form.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                size="lg"
                className="group h-12 min-h-12 gap-2 rounded-xl btn-gradient px-8 shadow-lg shadow-primary/25 transition-[box-shadow] hover:shadow-xl hover:shadow-primary/30"
                asChild
              >
                <Link href="/dashboard/advisor/evaluator/pending">
                  <ClipboardCheck className="h-5 w-5 shrink-0" aria-hidden />
                  Go to pending evaluations
                  <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" className="h-12 min-h-12 rounded-xl" asChild>
                <Link href="/dashboard/advisor/evaluator/scheduled">
                  <CheckCircle className="mr-2 h-5 w-5" aria-hidden />
                  All sessions
                </Link>
              </Button>
            </CardContent>
          </Card>
      </div>
    </div>
  )
}
