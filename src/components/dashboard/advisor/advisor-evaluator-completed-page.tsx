"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Eye,
  FileText,
  FolderKanban,
  History,
  Scale,
  Search,
  TrendingUp,
  Trophy,
} from "lucide-react"

import DataTable, { type Column } from "@/components/shared/DataTable"
import PageHeader from "@/components/shared/PageHeader"
import StatCard from "@/components/shared/StatCard"
import StatusBadge from "@/components/shared/StatusBadge"
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
import { mockEvaluations, mockProjects, formatDate, type Evaluation } from "@/data/mockData"

import { RUBRIC_TOTAL_MAX_PERCENT } from "./advisor-evaluator-shared"

function maxScore(e: Evaluation): number {
  return (e as Evaluation & { maxScore?: number }).maxScore ?? 100
}

function projectLabel(projectId: string): { title: string; group: string } {
  const p = mockProjects.find((x) => x.id === projectId)
  return {
    title: p?.title ?? "Unknown project",
    group: p?.groupName ?? "—",
  }
}

type StatusFilter = "all" | "submitted" | "reviewed"

export function AdvisorEvaluatorCompletedPage() {
  const completedEvaluations = React.useMemo(
    () => mockEvaluations.filter((e) => e.status === "submitted" || e.status === "reviewed"),
    [],
  )

  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")

  const filteredEvaluations = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return completedEvaluations.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false
      if (!q) return true
      const { title, group } = projectLabel(e.projectId)
      return (
        title.toLowerCase().includes(q) ||
        group.toLowerCase().includes(q) ||
        (e.evaluatorName?.toLowerCase().includes(q) ?? false) ||
        e.id.toLowerCase().includes(q)
      )
    })
  }, [completedEvaluations, search, statusFilter])

  const scored = completedEvaluations.filter((e) => typeof e.score === "number")
  const avgScore =
    scored.length > 0
      ? (scored.reduce((s, e) => s + (e.score ?? 0), 0) / scored.length).toFixed(1)
      : "—"
  const highest = scored.length > 0 ? Math.max(...scored.map((e) => e.score ?? 0)) : null

  const reviewedCount = completedEvaluations.filter((e) => e.status === "reviewed").length

  const topScored = React.useMemo(() => {
    if (!scored.length) return null
    return scored.reduce((a, b) => ((a.score ?? 0) >= (b.score ?? 0) ? a : b))
  }, [scored])

  const recentEvaluations = React.useMemo(() => {
    return [...completedEvaluations]
      .filter((e) => e.submittedAt)
      .sort((a, b) => {
        const ta = new Date(a.submittedAt ?? 0).getTime()
        const tb = new Date(b.submittedAt ?? 0).getTime()
        return tb - ta
      })
      .slice(0, 4)
  }, [completedEvaluations])

  const handleExport = React.useCallback(() => {
    toast.success("Export queued", {
      description: "Connect your reporting API to download CSV or PDF.",
    })
  }, [])

  const columns = React.useMemo<Column<Evaluation>[]>(
    () => [
      {
        key: "project",
        header: "Project",
        render: (e) => {
          const { title, group } = projectLabel(e.projectId)
          return (
            <div className="min-w-[160px]">
              <p className="font-medium leading-snug">{title}</p>
              <p className="text-sm text-muted-foreground">{group}</p>
            </div>
          )
        },
      },
      {
        key: "score",
        header: "Score",
        render: (e) => (
          <span className="text-lg font-bold tabular-nums text-primary">
            {e.score ?? "—"}
            <span className="text-sm font-normal text-muted-foreground">/{maxScore(e)}</span>
          </span>
        ),
      },
      {
        key: "submittedAt",
        header: "Submitted",
        render: (e) => (
          <span className="whitespace-nowrap text-sm">
            {e.submittedAt ? formatDate(e.submittedAt) : "—"}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (e) => <StatusBadge status={e.status} />,
      },
      {
        key: "actions",
        header: "Actions",
        render: (e) => (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 rounded-lg" asChild>
              <Link href={`/dashboard/advisor/evaluator/evaluations/${e.id}`} aria-label="View evaluation">
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-lg"
              type="button"
              aria-label="Download record"
              onClick={() =>
                toast.message("Download", { description: `Stub export for ${e.id}` })
              }
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

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
            title="Completed evaluations"
            description="Submitted and reviewed records in your advisor evaluator workspace — search, filter, and open detail views."
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
              Pending queue
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" aria-hidden />
            Export report
          </Button>
        </div>
      </div>

      <section aria-label="Summary statistics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total completed"
          value={completedEvaluations.length}
          subtitle="Submitted + reviewed"
          icon={History}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          title="Reviewed"
          value={reviewedCount}
          subtitle="Final / locked"
          icon={CheckCircle2}
          iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title="Avg score given"
          value={avgScore}
          subtitle={scored.length ? `Across ${scored.length} scored` : "No scores"}
          icon={TrendingUp}
          iconClassName="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
        <StatCard
          title="Highest score"
          value={highest ?? "—"}
          subtitle={topScored != null ? `Out of ${maxScore(topScored)}` : "—"}
          icon={Trophy}
          iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
      </section>

      {completedEvaluations.length > 0 && (topScored || recentEvaluations.length > 0) ? (
        <section aria-label="Highlights">
          <div className="grid gap-4 lg:grid-cols-2">
            {topScored ? (
              <Card className="border-primary/25 bg-gradient-to-br from-primary/[0.06] via-background to-background shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Top score in history</CardTitle>
                  <CardDescription>Highest recorded score in the current demo set.</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold leading-snug text-foreground">
                        {projectLabel(topScored.projectId).title}
                      </p>
                      <p className="text-sm text-muted-foreground">{projectLabel(topScored.projectId).group}</p>
                      <p className="mt-2 text-2xl font-bold tabular-nums text-primary">
                        {topScored.score}
                        <span className="text-lg font-semibold text-muted-foreground">/{maxScore(topScored)}</span>
                      </p>
                    </div>
                    <Button className="btn-gradient h-10 shrink-0 gap-2 shadow-md shadow-primary/20" asChild>
                      <Link href={`/dashboard/advisor/evaluator/evaluations/${topScored.id}`}>
                        View record
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {recentEvaluations.length > 0 ? (
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" aria-hidden />
                    <CardTitle className="text-base">Most recent</CardTitle>
                  </div>
                  <CardDescription>Newest submissions first (demo data).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {recentEvaluations.map((e) => {
                    const { title } = projectLabel(e.projectId)
                    return (
                      <Link
                        key={e.id}
                        href={`/dashboard/advisor/evaluator/evaluations/${e.id}`}
                        className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/15 px-3 py-2.5 text-sm transition-colors hover:border-primary/25 hover:bg-muted/30"
                      >
                        <span className="min-w-0 truncate font-medium">{title}</span>
                        <div className="flex shrink-0 items-center gap-2">
                          {e.submittedAt ? (
                            <span className="hidden text-xs text-muted-foreground sm:inline">
                              {formatDate(e.submittedAt)}
                            </span>
                          ) : null}
                          <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                        </div>
                      </Link>
                    )
                  })}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="min-w-0 space-y-6">
          <section aria-label="Filters">
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="border-b border-border/50 bg-muted/10 pb-3">
                <CardTitle className="text-base">Find evaluations</CardTitle>
                <CardDescription>Filter the table by project text or submission status.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-end">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    placeholder="Search project, group, evaluator, or id…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    aria-label="Search completed evaluations"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Label htmlFor="completed-status" className="sr-only">
                    Status
                  </Label>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                    <SelectTrigger id="completed-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </section>

          <section aria-label="Evaluation history">
            <Card className="overflow-hidden border-border/80 shadow-sm">
              <CardHeader className="flex flex-col gap-3 border-b border-border/50 bg-muted/10 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">Evaluation history</CardTitle>
                  <CardDescription>
                    {filteredEvaluations.length} record{filteredEvaluations.length === 1 ? "" : "s"}
                    {search.trim() || statusFilter !== "all" ? " (filtered)" : ""} — add server pagination when your API
                    is ready.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="h-10 w-full shrink-0 sm:w-auto" asChild>
                  <Link href="/dashboard/advisor/evaluator/pending">
                    <ClipboardCheck className="mr-2 h-4 w-4" aria-hidden />
                    Pending queue
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  {completedEvaluations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
                      <FileText className="h-10 w-10 text-muted-foreground/40" aria-hidden />
                      <p className="font-medium">No completed evaluations yet</p>
                      <p className="max-w-sm text-sm text-muted-foreground">
                        Finished reviews will appear here once submitted.
                      </p>
                      <Button variant="outline" size="sm" className="mt-2" asChild>
                        <Link href="/dashboard/advisor/evaluator/pending">Review pending</Link>
                      </Button>
                    </div>
                  ) : filteredEvaluations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
                      <Search className="h-10 w-10 text-muted-foreground/40" aria-hidden />
                      <p className="font-medium">No matches</p>
                      <p className="max-w-sm text-sm text-muted-foreground">Adjust search or status filter.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setSearch("")
                          setStatusFilter("all")
                        }}
                      >
                        Reset filters
                      </Button>
                    </div>
                  ) : (
                    <DataTable data={filteredEvaluations} columns={columns} />
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

        <section
          aria-label="Completed evaluations guidance"
          className="grid gap-4 border-t border-border/60 pt-8 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5"
        >
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 lg:col-span-5">
            <div className="flex items-center gap-2 text-primary">
              <History className="h-4 w-4" aria-hidden />
              <p className="text-sm font-semibold text-foreground">What each row is</p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Demo snapshots: project id, evaluator, score with its own denominator, status.{" "}
              <strong className="text-foreground">Submitted</strong> vs <strong className="text-foreground">reviewed</strong>{" "}
              should match your policy manual.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 lg:col-span-4">
            <div className="flex items-center gap-2 text-primary">
              <Scale className="h-4 w-4" aria-hidden />
              <p className="text-sm font-semibold text-foreground">Scales &amp; appeals</p>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Cite numerator and denominator when students ask. New reviews should align to the {RUBRIC_TOTAL_MAX_PERCENT}%
              rubric.
            </p>
            <Button variant="secondary" size="sm" className="mt-4 rounded-lg" asChild>
              <Link href="/dashboard/advisor/evaluator/rubric">
                <BookOpen className="mr-2 h-4 w-4" aria-hidden />
                Program rubric
              </Link>
            </Button>
          </div>
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-dashed border-border/60 bg-background p-5 lg:col-span-3">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Exports:</strong> filter by status first so CSVs split workflow vs locked
              records.
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" className="justify-start rounded-lg" asChild>
                <Link href="/dashboard/advisor/evaluator/documents">
                  <FileText className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                  Documents
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="justify-start rounded-lg" asChild>
                <Link href="/dashboard/advisor/evaluator/projects">
                  <FolderKanban className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                  Projects
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="justify-start rounded-lg" asChild>
                <Link href="/dashboard/advisor/evaluator/pending">
                  <ClipboardCheck className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                  Pending
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
