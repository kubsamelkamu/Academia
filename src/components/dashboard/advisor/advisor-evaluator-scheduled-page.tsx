"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Clock,
  FileText,
  MapPin,
  Mic,
  Search,
  Timer,
  Users,
  Video,
} from "lucide-react"

import PageHeader from "@/components/shared/PageHeader"
import StatCard from "@/components/shared/StatCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import { RUBRIC_TOTAL_MAX_PERCENT } from "./advisor-evaluator-shared"
import {
  ADVISOR_SCHEDULED_SESSIONS,
  type ScheduledSessionDetail,
  type ScheduledSessionStatus,
  type ScheduledSessionType,
} from "./advisor-evaluator-scheduled-data"

function formatSessionDate(dateString: string) {
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return dateString
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
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

function typeBadgeClass(type: ScheduledSessionType) {
  return type === "virtual"
    ? "border-primary/30 bg-primary/10 text-primary"
    : "text-foreground"
}

type SortKey = "date" | "project" | "status"

export function AdvisorEvaluatorScheduledPage() {
  const [search, setSearch] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState<"all" | ScheduledSessionType>("all")
  const [sort, setSort] = React.useState<SortKey>("date")

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = ADVISOR_SCHEDULED_SESSIONS.filter((s) => {
      if (typeFilter !== "all" && s.type !== typeFilter) return false
      if (!q) return true
      return (
        s.project.toLowerCase().includes(q) ||
        s.group.toLowerCase().includes(q) ||
        s.venue.toLowerCase().includes(q) ||
        s.evaluator.toLowerCase().includes(q)
      )
    })
    rows = [...rows].sort((a, b) => {
      if (sort === "project") return a.project.localeCompare(b.project)
      if (sort === "status") return a.status.localeCompare(b.status)
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })
    return rows
  }, [search, sort, typeFilter])

  const upcoming = ADVISOR_SCHEDULED_SESSIONS.filter((s) => s.status === "upcoming").length
  const inProgress = ADVISOR_SCHEDULED_SESSIONS.filter((s) => s.status === "in-progress").length
  const virtual = ADVISOR_SCHEDULED_SESSIONS.filter((s) => s.type === "virtual").length

  const nextActiveSession = React.useMemo(() => {
    const active = ADVISOR_SCHEDULED_SESSIONS.filter(
      (s) => s.status === "upcoming" || s.status === "in-progress",
    )
    if (active.length === 0) return null
    return [...active].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null
  }, [])

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 pb-8 animate-in fade-in duration-300 sm:gap-8 lg:gap-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1.5 text-muted-foreground" asChild>
            <Link href="/dashboard/advisor/evaluator">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Evaluator overview
            </Link>
          </Button>
          <PageHeader
            title="Scheduled sessions"
            description="Upcoming and in-progress evaluation meetings — open a session for agenda, team, documents, and session rubric notes."
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button variant="default" size="sm" className="btn-gradient gap-2 shadow-md shadow-primary/20" asChild>
            <Link href="/dashboard/advisor/evaluator/rubric">
              <BookOpen className="h-4 w-4" aria-hidden />
              Open rubric
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href="/dashboard/advisor/evaluator/pending">
              <ClipboardCheck className="h-4 w-4" aria-hidden />
              Pending evaluations
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href="/dashboard/advisor/evaluator/documents">
              <FileText className="h-4 w-4" aria-hidden />
              Document library
            </Link>
          </Button>
        </div>
      </div>

      <section aria-label="Summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total scheduled"
          value={ADVISOR_SCHEDULED_SESSIONS.length}
          subtitle="Demo sessions"
          icon={Calendar}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          title="Upcoming"
          value={upcoming}
          subtitle="Not started"
          icon={Clock}
          iconClassName="bg-sky-500/10 text-sky-600 dark:text-sky-400"
        />
        <StatCard
          title="In progress"
          value={inProgress}
          subtitle="Live or started"
          icon={Timer}
          iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <StatCard
          title="Showing"
          value={filtered.length}
          subtitle={search.trim() || typeFilter !== "all" ? "After filters" : "All sessions"}
          icon={Search}
          iconClassName="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
      </section>

      {virtual > 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/[0.06] px-4 py-3 text-sm text-muted-foreground">
          <Video className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
          <span>
            <span className="font-medium text-foreground">{virtual}</span> virtual session
            {virtual === 1 ? "" : "s"} — check venue for meeting links.
          </span>
        </div>
      ) : null}

      {nextActiveSession ? (
        <section aria-label="Next session spotlight">
          <Card className="border-primary/25 bg-gradient-to-br from-primary/[0.06] via-background to-background shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Calendar className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <CardTitle className="text-base">Next on your calendar</CardTitle>
                    <CardDescription>
                      Soonest active session (upcoming or in progress) by date.
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className={cn("capitalize", statusBadgeClass(nextActiveSession.status))}>
                  {nextActiveSession.status.replace("-", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-background/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold leading-snug text-foreground">{nextActiveSession.project}</p>
                  <p className="text-sm text-muted-foreground">{nextActiveSession.group}</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{formatSessionDate(nextActiveSession.date)}</span>
                    {" · "}
                    {nextActiveSession.time} · {nextActiveSession.evaluator}
                  </p>
                </div>
                <Button className="btn-gradient h-10 shrink-0 gap-2 shadow-md shadow-primary/20 sm:min-w-[180px]" asChild>
                  <Link href={`/dashboard/advisor/evaluator/scheduled/${nextActiveSession.id}`}>
                    Open session
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section aria-label="Session facilitation tips" className="space-y-2">
        <details className="group rounded-xl border border-border/70 bg-card shadow-sm open:bg-muted/20">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3.5 text-sm font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" aria-hidden />
              Virtual vs in person
            </span>
            <span className="text-xs text-muted-foreground transition group-open:rotate-180">▼</span>
          </summary>
          <div className="border-t border-border/60 px-4 pb-4 pt-2 text-sm leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">Virtual</strong> — venue text is your join path; test AV early and
              follow recording policy.
            </p>
            <p className="mt-2">
              <strong className="text-foreground">In person</strong> — book buffer for room setup, especially hardware demos.
            </p>
          </div>
        </details>
        <details className="group rounded-xl border border-border/70 bg-card shadow-sm open:bg-muted/20">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3.5 text-sm font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" aria-hidden />
              Timeboxing &amp; rubric
            </span>
            <span className="text-xs text-muted-foreground transition group-open:rotate-180">▼</span>
          </summary>
          <div className="space-y-2 border-t border-border/60 px-4 pb-4 pt-2 text-sm text-muted-foreground">
            <p>
              Treat agenda lines as timeboxes unless you explicitly extend Q&amp;A. Reserve the last block for notes you
              will need on the {RUBRIC_TOTAL_MAX_PERCENT}% form—not new scope.
            </p>
            <p>
              Session detail weights steer conversation; <strong className="text-foreground">official scores</strong> always
              use the program rubric.
            </p>
            <Button variant="secondary" size="sm" className="mt-2 h-8" asChild>
              <Link href="/dashboard/advisor/evaluator/rubric">
                <BookOpen className="mr-2 h-3.5 w-3.5" aria-hidden />
                Open rubric
              </Link>
            </Button>
          </div>
        </details>
        <details className="group rounded-xl border border-border/70 bg-card shadow-sm open:bg-muted/20">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3.5 text-sm font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-primary" aria-hidden />
              Live facilitation
            </span>
            <span className="text-xs text-muted-foreground transition group-open:rotate-180">▼</span>
          </summary>
          <p className="border-t border-border/60 px-4 pb-4 pt-2 text-sm text-muted-foreground">
            Assign clock-watcher, chat monitor (virtual), and note-taker. Clarify whether oral feedback in session is
            informal or counts toward final scores.
          </p>
        </details>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" size="sm" className="rounded-full" asChild>
            <Link href="/dashboard/advisor/evaluator/pending">
              <ClipboardCheck className="mr-2 h-4 w-4" aria-hidden />
              Pending queue
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" asChild>
            <Link href="/dashboard/advisor/evaluator/documents">
              <FileText className="mr-2 h-4 w-4" aria-hidden />
              Document library
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" asChild>
            <Link href="/dashboard/advisor/evaluator">Overview</Link>
          </Button>
        </div>
      </section>

      <div className="min-w-0 space-y-6">
          <section aria-label="Filters">
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="border-b border-border/50 bg-muted/10 pb-3">
                <CardTitle className="text-base">Find sessions</CardTitle>
                <CardDescription>Search by project, group, venue, or evaluator.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-5 lg:flex-row lg:items-end">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    placeholder="Search sessions…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    aria-label="Search scheduled sessions"
                  />
                </div>
                <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[300px]">
                  <div>
                    <Label htmlFor="sched-type" className="sr-only">
                      Format
                    </Label>
                    <Select
                      value={typeFilter}
                      onValueChange={(v) => setTypeFilter(v as "all" | ScheduledSessionType)}
                    >
                      <SelectTrigger id="sched-type">
                        <SelectValue placeholder="Format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All formats</SelectItem>
                        <SelectItem value="virtual">Virtual</SelectItem>
                        <SelectItem value="in-person">In person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sched-sort" className="sr-only">
                      Sort
                    </Label>
                    <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                      <SelectTrigger id="sched-sort">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date (soonest)</SelectItem>
                        <SelectItem value="project">Project (A–Z)</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section aria-label="Session list" className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-tight">Sessions</h2>
              <p className="text-sm text-muted-foreground">
                {filtered.length} session{filtered.length === 1 ? "" : "s"}
              </p>
            </div>

            {filtered.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <Calendar className="h-10 w-10 text-muted-foreground/40" aria-hidden />
                  <p className="font-medium">No sessions match</p>
                  <p className="max-w-sm text-sm text-muted-foreground">Clear filters or adjust search.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setSearch("")
                      setTypeFilter("all")
                    }}
                  >
                    Reset filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filtered.map((session) => (
                  <SessionSummaryCard key={session.id} session={session} />
                ))}
              </div>
            )}
          </section>
      </div>
    </div>
  )
}

function SessionSummaryCard({ session }: { session: ScheduledSessionDetail }) {
  const teamCount = session.teamMembers.length

  return (
    <Card className="flex flex-col overflow-hidden border-border/80 shadow-sm transition-[box-shadow] hover:shadow-md">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-base leading-snug sm:text-lg">{session.project}</CardTitle>
            <CardDescription className="mt-1">{session.group}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={cn("capitalize", statusBadgeClass(session.status))}>
              {session.status.replace("-", " ")}
            </Badge>
            <Badge variant="outline" className={cn("capitalize", typeBadgeClass(session.type))}>
              {session.type === "virtual" ? "Virtual" : "In person"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="mt-auto flex flex-1 flex-col gap-4 border-t border-border/50 bg-muted/15 pt-4">
        <div className="space-y-2.5 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div>
              <p className="font-medium text-foreground">{formatSessionDate(session.date)}</p>
              <p>
                {session.time} · {session.duration}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span className="leading-snug">{session.venue}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0" aria-hidden />
              <span>
                {teamCount} team member{teamCount === 1 ? "" : "s"}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              Evaluator: <span className="font-medium text-foreground">{session.evaluator}</span>
            </span>
          </div>
        </div>
        <Button
          asChild
          className="group h-10 w-full btn-gradient shadow-md shadow-primary/20 transition-[box-shadow] hover:shadow-lg hover:shadow-primary/25"
        >
          <Link href={`/dashboard/advisor/evaluator/scheduled/${session.id}`}>
            View session details
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
