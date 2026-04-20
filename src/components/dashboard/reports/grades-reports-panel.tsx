"use client"

import React, { useDeferredValue, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Download,
  Eye,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  GraduationCap,
  Loader2,
  PieChart,
  RefreshCw,
  Search,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

import { DashboardEmptyState, DashboardSectionCard } from "@/components/dashboard/page-primitives"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getErrorMessage } from "@/lib/api/errors"
import { downloadGradesReport } from "@/lib/api/grades-reports"
import { useAuthStoreHydrated } from "@/lib/hooks/use-auth-store-hydrated"
import { useGradesOverview, useGradesProjects, useGradesStudents } from "@/lib/hooks/use-grades-reports"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import type {
  GradesAggregationStatus,
  GradesOverviewResponse,
  GradesProjectAnalyticsItem,
  GradesProjectStatus,
  GradesReportFormat,
  GradesReportScope,
  GradesStage,
  ProjectFinalizationStatus,
  StudentFinalizationStatus,
} from "@/types/grades-reports"

type ActiveTab = "projects" | "students"
type CoordinatorView = "generate" | "history" | "analytics"
type DepartmentCategory = "all" | "academic" | "administrative" | "strategic" | "analytics"
type PanelVariant = "coordinator" | "department-head"

type ProjectFilterState = {
  search: string
  projectStatus: GradesProjectStatus | "all"
  aggregationStatus: GradesAggregationStatus | "all"
  finalizationStatus: ProjectFinalizationStatus | "all"
  page: number
}

type StudentFilterState = {
  search: string
  finalizationStatus: StudentFinalizationStatus | "all"
  letterGrade: string
  minFinalGrade: string
  maxFinalGrade: string
  page: number
}

type ReportCatalogCard = {
  id: string
  title: string
  description: string
  format: GradesReportFormat
  scope: GradesReportScope
  icon: React.ElementType
  category: Exclude<DepartmentCategory, "all">
  metrics: string[]
  tags: string[]
}

const STAGES: Array<{ value: GradesStage; label: string }> = [
  { value: "CAPSTONE_I", label: "Capstone I" },
  { value: "CAPSTONE_II", label: "Capstone II" },
]

const LETTER_GRADES = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"]

const DEFAULT_PROJECT_FILTERS: ProjectFilterState = {
  search: "",
  projectStatus: "all",
  aggregationStatus: "all",
  finalizationStatus: "all",
  page: 1,
}

const DEFAULT_STUDENT_FILTERS: StudentFilterState = {
  search: "",
  finalizationStatus: "all",
  letterGrade: "",
  minFinalGrade: "",
  maxFinalGrade: "",
  page: 1,
}

const ACTIVE_TABS: ActiveTab[] = ["projects", "students"]
const COORDINATOR_VIEWS: CoordinatorView[] = ["generate", "history", "analytics"]
const DEPARTMENT_CATEGORIES: DepartmentCategory[] = ["all", "academic", "administrative", "strategic", "analytics"]

function parseEnumValue<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  if (value && allowed.includes(value as T)) {
    return value as T
  }

  return fallback
}

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseStage(value: string | null): GradesStage {
  return value === "CAPSTONE_II" ? "CAPSTONE_II" : "CAPSTONE_I"
}

function parseProjectStatus(value: string | null): GradesProjectStatus | "all" {
  return parseEnumValue(value, ["all", "ACTIVE", "COMPLETED", "CANCELLED"] as const, "all")
}

function parseAggregationStatus(value: string | null): GradesAggregationStatus | "all" {
  return parseEnumValue(
    value,
    ["all", "WAITING_FOR_WEIGHTS", "WAITING_FOR_ADVISOR", "WAITING_FOR_EVALUATORS", "READY_FOR_AGGREGATION"] as const,
    "all"
  )
}

function parseProjectFinalizationStatus(value: string | null): ProjectFinalizationStatus | "all" {
  return parseEnumValue(
    value,
    ["all", "NOT_FINALIZED", "FINALIZED_PENDING_DEPARTMENT_HEAD", "APPROVED", "REJECTED"] as const,
    "all"
  )
}

function parseStudentFinalizationStatus(value: string | null): StudentFinalizationStatus | "all" {
  return parseEnumValue(
    value,
    ["all", "FINALIZED_PENDING_DEPARTMENT_HEAD", "APPROVED", "REJECTED"] as const,
    "all"
  )
}

function buildPanelUrlState(searchParams: ReadonlyURLSearchParams) {
  const letterGrade = searchParams.get("sg") ?? ""

  return {
    stage: parseStage(searchParams.get("stage")),
    activeTab: parseEnumValue(searchParams.get("tab"), ACTIVE_TABS, "projects"),
    coordinatorView: parseEnumValue(searchParams.get("view"), COORDINATOR_VIEWS, "generate"),
    departmentCategory: parseEnumValue(searchParams.get("category"), DEPARTMENT_CATEGORIES, "all"),
    catalogSearch: searchParams.get("catalog") ?? "",
    projectFilters: {
      search: searchParams.get("pq") ?? "",
      projectStatus: parseProjectStatus(searchParams.get("pps")),
      aggregationStatus: parseAggregationStatus(searchParams.get("pas")),
      finalizationStatus: parseProjectFinalizationStatus(searchParams.get("pfs")),
      page: parsePositiveInt(searchParams.get("pp"), 1),
    },
    studentFilters: {
      search: searchParams.get("sq") ?? "",
      finalizationStatus: parseStudentFinalizationStatus(searchParams.get("sfs")),
      letterGrade: LETTER_GRADES.includes(letterGrade) ? letterGrade : "",
      minFinalGrade: searchParams.get("smin") ?? "",
      maxFinalGrade: searchParams.get("smax") ?? "",
      page: parsePositiveInt(searchParams.get("sp"), 1),
    },
  }
}

function formatStageLabel(stage: GradesStage) {
  return stage === "CAPSTONE_I" ? "Capstone I" : "Capstone II"
}

function formatDate(value: string | null | undefined) {
  if (!value) return "--"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "--"
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatNumber(value: number | null | undefined, digits = 1) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--"
  return value.toFixed(digits)
}

function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = objectUrl
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "APPROVED":
    case "READY_FOR_AGGREGATION":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
    case "FINALIZED_PENDING_DEPARTMENT_HEAD":
    case "WAITING_FOR_EVALUATORS":
      return "bg-amber-500/10 text-amber-700 border-amber-500/20"
    case "WAITING_FOR_ADVISOR":
    case "NOT_FINALIZED":
      return "bg-blue-500/10 text-blue-700 border-blue-500/20"
    case "REJECTED":
      return "bg-destructive/10 text-destructive border-destructive/20"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

function projectGradeValue(item: GradesProjectAnalyticsItem) {
  const value = item.finalResult
  if (!value || typeof value !== "object") {
    return null
  }

  const candidates = ["averageFinalGrade", "finalGrade", "finalScore"]
  for (const key of candidates) {
    const rawValue = value[key]
    if (typeof rawValue === "number") {
      return rawValue
    }
  }

  return null
}

function LoadingBlock() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

function DistributionCard({ title, items }: { title: string; items: Array<{ label: string; count: number }> }) {
  const maxCount = Math.max(...items.map((item) => item.count), 1)

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium">{item.count}</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${Math.max((item.count / maxCount) * 100, item.count > 0 ? 6 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function PaginationControls({
  page,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
}: {
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  onPageChange: (nextPage: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">
        Page {page} of {Math.max(totalPages, 1)}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={!hasPreviousPage} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={!hasNextPage} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}

function OverviewMetricGrid({ overview }: { overview: GradesOverviewResponse }) {
  const items = [
    {
      label: "Project Groups",
      value: String(overview.pipeline.totalProjectGroups),
      note: `${overview.pipeline.readyForAggregationCount} ready for aggregation`,
      icon: FolderKanban,
      tone: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Pending Review",
      value: String(overview.review.pendingReviewCount),
      note: `${overview.review.approvalRatePercent}% approval rate`,
      icon: Clock,
      tone: "text-amber-600",
      bg: "bg-amber-500/10",
    },
    {
      label: "Published Students",
      value: String(overview.grades.totalPublishedStudents),
      note: `${overview.grades.totalFinalizedStudents} finalized`,
      icon: GraduationCap,
      tone: "text-emerald-600",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Average Final Grade",
      value: formatNumber(overview.grades.averageFinalGrade),
      note: `High ${formatNumber(overview.grades.highestFinalGrade)} / Low ${formatNumber(overview.grades.lowestFinalGrade)}`,
      icon: TrendingUp,
      tone: "text-blue-600",
      bg: "bg-blue-500/10",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="group border-none shadow-sm transition-all hover:shadow-md">
          <CardContent className="flex items-center gap-3 p-4">
            <div className={cn("h-11 w-11 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", item.bg)}>
              <item.icon className={cn("h-5 w-5", item.tone)} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tracking-tight">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-[11px] text-muted-foreground mt-1 truncate">{item.note}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function DrilldownWorkspace({
  activeTab,
  onActiveTabChange,
  projectFilters,
  onProjectFiltersChange,
  studentFilters,
  onStudentFiltersChange,
  downloadState,
  onDownload,
  downloadError,
  projectsQuery,
  studentsQuery,
}: {
  activeTab: ActiveTab
  onActiveTabChange: (tab: ActiveTab) => void
  projectFilters: ProjectFilterState
  onProjectFiltersChange: React.Dispatch<React.SetStateAction<ProjectFilterState>>
  studentFilters: StudentFilterState
  onStudentFiltersChange: React.Dispatch<React.SetStateAction<StudentFilterState>>
  downloadState: Record<GradesReportFormat, boolean>
  onDownload: (format: GradesReportFormat, scope?: GradesReportScope) => Promise<void>
  downloadError: string | null
  projectsQuery: ReturnType<typeof useGradesProjects>
  studentsQuery: ReturnType<typeof useGradesStudents>
}) {
  const activeQuery = activeTab === "projects" ? projectsQuery : studentsQuery

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(value) => onActiveTabChange(value as ActiveTab)}>
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === "projects" ? (
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={projectFilters.search}
              onChange={(event) => onProjectFiltersChange((current) => ({ ...current, page: 1, search: event.target.value }))}
              className="pl-9"
              placeholder="Search project, group, or advisor"
            />
          </div>
          <Select
            value={projectFilters.aggregationStatus}
            onValueChange={(value) => onProjectFiltersChange((current) => ({ ...current, page: 1, aggregationStatus: value as ProjectFilterState["aggregationStatus"] }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Aggregation status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All aggregation states</SelectItem>
              <SelectItem value="WAITING_FOR_WEIGHTS">Waiting for weights</SelectItem>
              <SelectItem value="WAITING_FOR_ADVISOR">Waiting for advisor</SelectItem>
              <SelectItem value="WAITING_FOR_EVALUATORS">Waiting for evaluators</SelectItem>
              <SelectItem value="READY_FOR_AGGREGATION">Ready for aggregation</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={projectFilters.finalizationStatus}
            onValueChange={(value) => onProjectFiltersChange((current) => ({ ...current, page: 1, finalizationStatus: value as ProjectFilterState["finalizationStatus"] }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Finalization status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All finalization states</SelectItem>
              <SelectItem value="NOT_FINALIZED">Not finalized</SelectItem>
              <SelectItem value="FINALIZED_PENDING_DEPARTMENT_HEAD">Pending department head</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={studentFilters.search}
              onChange={(event) => onStudentFiltersChange((current) => ({ ...current, page: 1, search: event.target.value }))}
              className="pl-9"
              placeholder="Search student, project, or group"
            />
          </div>
          <Select
            value={studentFilters.finalizationStatus}
            onValueChange={(value) => onStudentFiltersChange((current) => ({ ...current, page: 1, finalizationStatus: value as StudentFilterState["finalizationStatus"] }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Finalization status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="FINALIZED_PENDING_DEPARTMENT_HEAD">Pending approval</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={studentFilters.letterGrade || "all"}
            onValueChange={(value) => onStudentFiltersChange((current) => ({ ...current, page: 1, letterGrade: value === "all" ? "" : value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Letter grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All grades</SelectItem>
              {LETTER_GRADES.map((grade) => (
                <SelectItem key={grade} value={grade}>{grade}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min="0"
            max="100"
            value={studentFilters.minFinalGrade}
            onChange={(event) => onStudentFiltersChange((current) => ({ ...current, page: 1, minFinalGrade: event.target.value }))}
            placeholder="Min grade"
          />
          <Input
            type="number"
            min="0"
            max="100"
            value={studentFilters.maxFinalGrade}
            onChange={(event) => onStudentFiltersChange((current) => ({ ...current, page: 1, maxFinalGrade: event.target.value }))}
            placeholder="Max grade"
          />
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-medium">Export active {activeTab} view</p>
          <p className="text-sm text-muted-foreground">
            The exported file reuses the current stage and active table filters.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={downloadState.csv} onClick={() => void onDownload("csv")}>
            {downloadState.csv ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            Download CSV
          </Button>
          <Button variant="outline" size="sm" disabled={downloadState.excel} onClick={() => void onDownload("excel")}>
            {downloadState.excel ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
            Download Excel
          </Button>
          <Button variant="outline" size="sm" disabled={downloadState.pdf} onClick={() => void onDownload("pdf")}>
            {downloadState.pdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Download PDF
          </Button>
        </div>
      </div>

      {downloadError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Export failed</AlertTitle>
          <AlertDescription>{downloadError}</AlertDescription>
        </Alert>
      ) : null}

      {activeQuery.error && !activeQuery.data ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load {activeTab}</AlertTitle>
          <AlertDescription>{getErrorMessage(activeQuery.error, "Please try again.")}</AlertDescription>
        </Alert>
      ) : activeQuery.isLoading && !activeQuery.data ? (
        <LoadingBlock />
      ) : activeTab === "projects" ? (
        projectsQuery.data?.items?.length ? (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Advisor</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Aggregation</TableHead>
                  <TableHead>Finalization</TableHead>
                  <TableHead>Evaluator Progress</TableHead>
                  <TableHead>Final Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectsQuery.data.items.map((item) => {
                  const finalGrade = projectGradeValue(item)
                  return (
                    <TableRow key={item.projectId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.projectTitle}</p>
                          <p className="text-xs text-muted-foreground">{item.projectStatus}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{item.advisor?.fullName ?? "--"}</p>
                          <p className="text-xs text-muted-foreground">{item.advisor?.email ?? "--"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{item.group?.name ?? "--"}</p>
                          <p className="text-xs text-muted-foreground">{item.group?.totalMembers ?? 0} members</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusBadgeClass(item.aggregationStatus)}>{item.aggregationStatus}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusBadgeClass(item.finalizationStatus)}>{item.finalizationStatus}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.progress.submittedEvaluatorsCount}/{item.progress.assignedEvaluatorsCount}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.progress.advisorSubmitted ? "Advisor submitted" : "Advisor pending"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{finalGrade === null ? "--" : formatNumber(finalGrade)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            <PaginationControls
              page={projectsQuery.data.pagination.page}
              totalPages={projectsQuery.data.pagination.totalPages}
              hasNextPage={projectsQuery.data.pagination.hasNextPage}
              hasPreviousPage={projectsQuery.data.pagination.hasPreviousPage}
              onPageChange={(nextPage) => onProjectFiltersChange((current) => ({ ...current, page: nextPage }))}
            />
          </div>
        ) : (
          <DashboardEmptyState
            title="No project rows"
            description="Adjust the current filters or switch stages to load project analytics."
          />
        )
      ) : studentsQuery.data?.items?.length ? (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Advisor Score</TableHead>
                <TableHead>Evaluator Avg</TableHead>
                <TableHead>Final Grade</TableHead>
                <TableHead>Letter</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentsQuery.data.items.map((item) => (
                <TableRow key={item.finalResultScoreId}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.student.fullName}</p>
                      <p className="text-xs text-muted-foreground">{item.student.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{item.project.title}</p>
                      <p className="text-xs text-muted-foreground">{item.group?.name ?? "--"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusBadgeClass(item.finalizationStatus)}>{item.finalizationStatus}</Badge>
                  </TableCell>
                  <TableCell>{item.isPublished ? "Yes" : "No"}</TableCell>
                  <TableCell>{formatNumber(item.scores.advisorScore)}</TableCell>
                  <TableCell>{formatNumber(item.scores.evaluatorAverageScore)}</TableCell>
                  <TableCell>{formatNumber(item.scores.finalGrade)}</TableCell>
                  <TableCell>{item.scores.letterGrade ?? "--"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <PaginationControls
            page={studentsQuery.data.pagination.page}
            totalPages={studentsQuery.data.pagination.totalPages}
            hasNextPage={studentsQuery.data.pagination.hasNextPage}
            hasPreviousPage={studentsQuery.data.pagination.hasPreviousPage}
            onPageChange={(nextPage) => onStudentFiltersChange((current) => ({ ...current, page: nextPage }))}
          />
        </div>
      ) : (
        <DashboardEmptyState
          title="No student rows"
          description="Adjust the current filters or switch stages to load student analytics."
        />
      )}
    </div>
  )
}

function CoordinatorQuickCard({
  icon: Icon,
  label,
  description,
  onClick,
  busy,
  dashed,
}: {
  icon: React.ElementType
  label: string
  description: string
  onClick: () => void
  busy?: boolean
  dashed?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={cn(
        "group rounded-xl border bg-card p-5 text-left transition-all hover:shadow-md hover:border-primary/30 hover:bg-primary/[0.02] disabled:opacity-60",
        dashed && "border-dashed"
      )}
    >
      <div className="flex flex-col items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110">
          {busy ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Icon className="h-5 w-5 text-primary" />}
        </div>
        <div>
          <p className="font-semibold text-sm">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{description}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-primary font-medium mt-auto">
          Generate <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </button>
  )
}

function DepartmentReportCard({
  card,
  onDownload,
  onView,
  busy,
}: {
  card: ReportCatalogCard
  onDownload: () => void
  onView: () => void
  busy?: boolean
}) {
  const Icon = card.icon

  return (
    <Card className="hover:shadow-lg transition-all hover:border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <Badge variant="outline" className="bg-background uppercase">{card.format}</Badge>
        </div>
        <CardTitle className="text-base mt-3">{card.title}</CardTitle>
        <CardDescription className="text-xs line-clamp-2">{card.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-3 space-y-3">
        <div className="grid gap-2">
          {card.metrics.map((metric) => (
            <div key={metric} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Metric</span>
              <span className="font-medium text-right">{metric}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {card.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[11px]">{tag}</Badge>
          ))}
        </div>
      </CardContent>
      <div className="px-6 pb-6 pt-0 flex gap-2">
        <Button className="flex-1" size="sm" onClick={onDownload} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Download
        </Button>
        <Button variant="outline" size="sm" title="View live data" onClick={onView}>
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}

export function GradesReportsPanel({
  roleLabel,
  variant = "coordinator",
}: {
  roleLabel: string
  variant?: PanelVariant
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const authHydrated = useAuthStoreHydrated()
  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)
  const departmentId = user?.departmentId ?? user?.department?.id ?? null
  const urlState = useMemo(() => buildPanelUrlState(searchParams), [searchParams])
  const [stage, setStage] = useState<GradesStage>(urlState.stage)
  const [activeTab, setActiveTab] = useState<ActiveTab>(urlState.activeTab)
  const [coordinatorView, setCoordinatorView] = useState<CoordinatorView>(urlState.coordinatorView)
  const [departmentCategory, setDepartmentCategory] = useState<DepartmentCategory>(urlState.departmentCategory)
  const [catalogSearch, setCatalogSearch] = useState(urlState.catalogSearch)
  const [projectFilters, setProjectFilters] = useState<ProjectFilterState>(urlState.projectFilters)
  const [studentFilters, setStudentFilters] = useState<StudentFilterState>(urlState.studentFilters)
  const [downloadState, setDownloadState] = useState<Record<GradesReportFormat, boolean>>({
    csv: false,
    excel: false,
    pdf: false,
  })
  const [downloadError, setDownloadError] = useState<string | null>(null)

  React.useEffect(() => {
    setStage(urlState.stage)
    setActiveTab(urlState.activeTab)
    setCoordinatorView(urlState.coordinatorView)
    setDepartmentCategory(urlState.departmentCategory)
    setCatalogSearch(urlState.catalogSearch)
    setProjectFilters(urlState.projectFilters)
    setStudentFilters(urlState.studentFilters)
  }, [urlState])

  const updateUrlState = (nextState: {
    stage?: GradesStage
    activeTab?: ActiveTab
    coordinatorView?: CoordinatorView
    departmentCategory?: DepartmentCategory
    catalogSearch?: string
    projectFilters?: ProjectFilterState
    studentFilters?: StudentFilterState
  }) => {
    const resolvedStage = nextState.stage ?? stage
    const resolvedActiveTab = nextState.activeTab ?? activeTab
    const resolvedCoordinatorView = nextState.coordinatorView ?? coordinatorView
    const resolvedDepartmentCategory = nextState.departmentCategory ?? departmentCategory
    const resolvedCatalogSearch = nextState.catalogSearch ?? catalogSearch
    const resolvedProjectFilters = nextState.projectFilters ?? projectFilters
    const resolvedStudentFilters = nextState.studentFilters ?? studentFilters

    const nextParams = new URLSearchParams(searchParams.toString())
    const setValue = (key: string, value: string | number | null | undefined, fallback?: string | number) => {
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        (fallback !== undefined && String(value) === String(fallback))
      ) {
        nextParams.delete(key)
        return
      }

      nextParams.set(key, String(value))
    }

    setValue("stage", resolvedStage, "CAPSTONE_I")
    setValue("tab", resolvedActiveTab, "projects")
    setValue("view", resolvedCoordinatorView, "generate")
    setValue("category", resolvedDepartmentCategory, "all")
    setValue("catalog", resolvedCatalogSearch.trim())
    setValue("pq", resolvedProjectFilters.search.trim())
    setValue("pps", resolvedProjectFilters.projectStatus, "all")
    setValue("pas", resolvedProjectFilters.aggregationStatus, "all")
    setValue("pfs", resolvedProjectFilters.finalizationStatus, "all")
    setValue("pp", resolvedProjectFilters.page, 1)
    setValue("sq", resolvedStudentFilters.search.trim())
    setValue("sfs", resolvedStudentFilters.finalizationStatus, "all")
    setValue("sg", resolvedStudentFilters.letterGrade)
    setValue("smin", resolvedStudentFilters.minFinalGrade)
    setValue("smax", resolvedStudentFilters.maxFinalGrade)
    setValue("sp", resolvedStudentFilters.page, 1)

    const nextQuery = nextParams.toString()
    const currentQuery = searchParams.toString()

    if (nextQuery !== currentQuery) {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
    }
  }

  const setStageAndUrl = (nextStage: GradesStage) => {
    const nextProjectFilters = { ...DEFAULT_PROJECT_FILTERS }
    const nextStudentFilters = { ...DEFAULT_STUDENT_FILTERS }
    setStage(nextStage)
    setProjectFilters(nextProjectFilters)
    setStudentFilters(nextStudentFilters)
    setDownloadError(null)
    updateUrlState({
      stage: nextStage,
      projectFilters: nextProjectFilters,
      studentFilters: nextStudentFilters,
    })
  }

  const setActiveTabAndUrl = (nextTab: ActiveTab) => {
    setActiveTab(nextTab)
    setDownloadError(null)
    updateUrlState({ activeTab: nextTab })
  }

  const setCoordinatorViewAndUrl = (nextView: CoordinatorView) => {
    setCoordinatorView(nextView)
    updateUrlState({ coordinatorView: nextView })
  }

  const setDepartmentCategoryAndUrl = (nextCategory: DepartmentCategory) => {
    setDepartmentCategory(nextCategory)
    updateUrlState({ departmentCategory: nextCategory })
  }

  const setCatalogSearchAndUrl = (nextSearch: string) => {
    setCatalogSearch(nextSearch)
    updateUrlState({ catalogSearch: nextSearch })
  }

  const updateProjectFiltersWithUrl: React.Dispatch<React.SetStateAction<ProjectFilterState>> = (updater) => {
    const nextFilters = typeof updater === "function" ? updater(projectFilters) : updater
    setProjectFilters(nextFilters)
    updateUrlState({ projectFilters: nextFilters })
  }

  const updateStudentFiltersWithUrl: React.Dispatch<React.SetStateAction<StudentFilterState>> = (updater) => {
    const nextFilters = typeof updater === "function" ? updater(studentFilters) : updater
    setStudentFilters(nextFilters)
    updateUrlState({ studentFilters: nextFilters })
  }

  const deferredProjectSearch = useDeferredValue(projectFilters.search)
  const deferredStudentSearch = useDeferredValue(studentFilters.search)
  const deferredCatalogSearch = useDeferredValue(catalogSearch)
  const queryEnabled = authHydrated && Boolean(accessToken)

  const overviewQuery = useGradesOverview({
    stage,
    departmentId,
    enabled: queryEnabled,
  })

  const projectsQuery = useGradesProjects({
    stage,
    departmentId,
    search: deferredProjectSearch || undefined,
    projectStatus: projectFilters.projectStatus === "all" ? null : projectFilters.projectStatus,
    aggregationStatus: projectFilters.aggregationStatus === "all" ? null : projectFilters.aggregationStatus,
    finalizationStatus: projectFilters.finalizationStatus === "all" ? null : projectFilters.finalizationStatus,
    page: projectFilters.page,
    limit: 20,
    enabled: queryEnabled,
  })

  const studentsQuery = useGradesStudents({
    stage,
    departmentId,
    search: deferredStudentSearch || undefined,
    finalizationStatus: studentFilters.finalizationStatus === "all" ? null : studentFilters.finalizationStatus,
    letterGrade: studentFilters.letterGrade || null,
    minFinalGrade: studentFilters.minFinalGrade ? Number(studentFilters.minFinalGrade) : null,
    maxFinalGrade: studentFilters.maxFinalGrade ? Number(studentFilters.maxFinalGrade) : null,
    page: studentFilters.page,
    limit: 20,
    enabled: queryEnabled,
  })

  const letterGradeDistribution = useMemo(() => {
    const source = overviewQuery.data?.distributions.letterGrades ?? {}
    return LETTER_GRADES.map((grade) => ({ label: grade, count: source[grade] ?? 0 }))
  }, [overviewQuery.data?.distributions.letterGrades])

  const scoreBandDistribution = overviewQuery.data?.distributions.scoreBands ?? []

  const currentFilters = useMemo(() => ({
    projects: {
      search: deferredProjectSearch || undefined,
      projectStatus: projectFilters.projectStatus === "all" ? null : projectFilters.projectStatus,
      aggregationStatus: projectFilters.aggregationStatus === "all" ? null : projectFilters.aggregationStatus,
      finalizationStatus: projectFilters.finalizationStatus === "all" ? null : projectFilters.finalizationStatus,
    },
    students: {
      search: deferredStudentSearch || undefined,
      finalizationStatus: studentFilters.finalizationStatus === "all" ? null : studentFilters.finalizationStatus,
      letterGrade: studentFilters.letterGrade || null,
      minFinalGrade: studentFilters.minFinalGrade ? Number(studentFilters.minFinalGrade) : null,
      maxFinalGrade: studentFilters.maxFinalGrade ? Number(studentFilters.maxFinalGrade) : null,
    },
  }), [
    deferredProjectSearch,
    deferredStudentSearch,
    projectFilters.projectStatus,
    projectFilters.aggregationStatus,
    projectFilters.finalizationStatus,
    studentFilters.finalizationStatus,
    studentFilters.letterGrade,
    studentFilters.minFinalGrade,
    studentFilters.maxFinalGrade,
  ])

  const coordinatorQuickReports = useMemo(() => {
    const overview = overviewQuery.data
    return [
      {
        id: "grades-pdf",
        label: "Grade Report",
        description: `${formatStageLabel(stage)} summary with ${overview?.grades.totalPublishedStudents ?? 0} published students.`,
        icon: GraduationCap,
        scope: "students" as const,
        format: "pdf" as const,
      },
      {
        id: "projects-excel",
        label: "Project Report",
        description: `${overview?.pipeline.readyForAggregationCount ?? 0} groups are ready for aggregation.`,
        icon: FolderKanban,
        scope: "projects" as const,
        format: "excel" as const,
      },
      {
        id: "workflow-csv",
        label: "Workflow Report",
        description: `${overview?.review.pendingReviewCount ?? 0} results still need department-head review.`,
        icon: ClipboardCheck,
        scope: "projects" as const,
        format: "csv" as const,
      },
      {
        id: "students-excel",
        label: "Student Report",
        description: `Average final grade ${formatNumber(overview?.grades.averageFinalGrade)} across current student results.`,
        icon: Users,
        scope: "students" as const,
        format: "excel" as const,
      },
      {
        id: "active-view",
        label: "Current View",
        description: `Export the active ${activeTab} workspace with the current filters already applied.`,
        icon: Zap,
        scope: activeTab,
        format: "pdf" as const,
        dashed: true,
      },
    ]
  }, [overviewQuery.data, stage, activeTab])

  const departmentCatalog = useMemo<Record<Exclude<DepartmentCategory, "all">, ReportCatalogCard[]>>(() => {
    const overview = overviewQuery.data

    return {
      academic: [
        {
          id: "grade-distribution",
          title: "Grade Distribution Analysis",
          description: `Letter-grade and score-band analytics for ${formatStageLabel(stage)} final grades.`,
          format: "pdf",
          scope: "students",
          icon: PieChart,
          category: "academic",
          metrics: [
            `Average ${formatNumber(overview?.grades.averageFinalGrade)}`,
            `${overview?.grades.totalPublishedStudents ?? 0} published students`,
          ],
          tags: ["grades", "distribution", "performance"],
        },
        {
          id: "student-performance",
          title: "Student Performance Trends",
          description: "Student-level drilldown for approval state, publication state, and final grade spread.",
          format: "excel",
          scope: "students",
          icon: TrendingUp,
          category: "academic",
          metrics: [
            `${overview?.review.approvedCount ?? 0} approved results`,
            `${overview?.review.rejectedCount ?? 0} rejected results`,
          ],
          tags: ["students", "trends", "analytics"],
        },
        {
          id: "project-readiness",
          title: "Project Grade Completion",
          description: "Project-level readiness, evaluator progress, and finalization workflow visibility.",
          format: "excel",
          scope: "projects",
          icon: Clock,
          category: "academic",
          metrics: [
            `${overview?.pipeline.waitingForEvaluatorsCount ?? 0} waiting for evaluators`,
            `${overview?.pipeline.readyForAggregationCount ?? 0} ready for aggregation`,
          ],
          tags: ["projects", "timeline", "workflow"],
        },
      ],
      administrative: [
        {
          id: "approval-workflow",
          title: "Grade Approval Workflow Analysis",
          description: "Review backlog, approval rate, and rejected-result visibility for department oversight.",
          format: "excel",
          scope: "projects",
          icon: ClipboardCheck,
          category: "administrative",
          metrics: [
            `${overview?.review.pendingReviewCount ?? 0} pending review`,
            `${overview?.review.approvalRatePercent ?? 0}% approval rate`,
          ],
          tags: ["workflow", "approval", "governance"],
        },
        {
          id: "weights-configuration",
          title: "Weights Configuration Snapshot",
          description: "Advisor/evaluator weighting readiness for the active capstone stage.",
          format: "pdf",
          scope: "projects",
          icon: Target,
          category: "administrative",
          metrics: [
            `Advisor ${overview?.weights.advisorPercentage ?? 0}%`,
            `Evaluator ${overview?.weights.evaluatorPercentage ?? 0}%`,
          ],
          tags: ["weights", "configuration", "policy"],
        },
        {
          id: "publication-readiness",
          title: "Publication Readiness Report",
          description: "Published versus finalized student counts for the current stage.",
          format: "csv",
          scope: "students",
          icon: FileBarChart,
          category: "administrative",
          metrics: [
            `${overview?.grades.totalFinalizedStudents ?? 0} finalized students`,
            `${overview?.grades.totalPublishedStudents ?? 0} published students`,
          ],
          tags: ["publication", "students", "reporting"],
        },
      ],
      strategic: [
        {
          id: "kpi-dashboard",
          title: "Department KPIs & Performance",
          description: "Stage-wide KPI summary for final grade quality, review throughput, and publication coverage.",
          format: "pdf",
          scope: "students",
          icon: Activity,
          category: "strategic",
          metrics: [
            `High ${formatNumber(overview?.grades.highestFinalGrade)}`,
            `Low ${formatNumber(overview?.grades.lowestFinalGrade)}`,
          ],
          tags: ["kpis", "strategy", "performance"],
        },
        {
          id: "review-governance",
          title: "Review Governance Snapshot",
          description: "Approved, rejected, and pending decision counts for leadership reporting.",
          format: "pdf",
          scope: "projects",
          icon: CheckCircle2,
          category: "strategic",
          metrics: [
            `${overview?.review.approvedCount ?? 0} approved`,
            `${overview?.review.rejectedCount ?? 0} rejected`,
          ],
          tags: ["governance", "oversight", "review"],
        },
        {
          id: "student-outcomes",
          title: "Student Outcome Summary",
          description: "Student-level outcome export aligned with current stage and department scope.",
          format: "excel",
          scope: "students",
          icon: GraduationCap,
          category: "strategic",
          metrics: [
            `${overview?.grades.totalPublishedStudents ?? 0} published`,
            `Average ${formatNumber(overview?.grades.averageFinalGrade)}`,
          ],
          tags: ["outcomes", "students", "visibility"],
        },
      ],
      analytics: [
        {
          id: "score-bands",
          title: "Score Band Dashboard",
          description: "Score-band distribution and final-grade spread for the active stage.",
          format: "pdf",
          scope: "students",
          icon: BarChart3,
          category: "analytics",
          metrics: [
            `${scoreBandDistribution.length} score bands`,
            `${letterGradeDistribution.filter((entry) => entry.count > 0).length} active letter grades`,
          ],
          tags: ["bands", "distribution", "charts"],
        },
        {
          id: "project-pipeline",
          title: "Project Pipeline Analytics",
          description: "Project-group pipeline counts from waiting-for-advisor through approval outcomes.",
          format: "excel",
          scope: "projects",
          icon: FolderKanban,
          category: "analytics",
          metrics: [
            `${overview?.pipeline.waitingForAdvisorCount ?? 0} waiting for advisor`,
            `${overview?.pipeline.approvedCount ?? 0} approved`,
          ],
          tags: ["pipeline", "projects", "analytics"],
        },
        {
          id: "student-drilldown",
          title: "Student Drilldown Export",
          description: "Detailed student row export with advisor, evaluator, final, and letter-grade metrics.",
          format: "csv",
          scope: "students",
          icon: Users,
          category: "analytics",
          metrics: [
            `${studentsQuery.data?.pagination.totalItems ?? 0} visible student rows`,
            `${projectsQuery.data?.pagination.totalItems ?? 0} visible project rows`,
          ],
          tags: ["drilldown", "students", "export"],
        },
      ],
    }
  }, [
    letterGradeDistribution,
    overviewQuery.data,
    projectsQuery.data?.pagination.totalItems,
    scoreBandDistribution.length,
    stage,
    studentsQuery.data?.pagination.totalItems,
  ])

  const allCatalogCards = useMemo(() => Object.values(departmentCatalog).flat(), [departmentCatalog])

  const visibleCatalogCards = useMemo(() => {
    const source = departmentCategory === "all" ? allCatalogCards : departmentCatalog[departmentCategory]
    const query = deferredCatalogSearch.trim().toLowerCase()

    if (!query) {
      return source
    }

    return source.filter((card) => {
      return (
        card.title.toLowerCase().includes(query) ||
        card.description.toLowerCase().includes(query) ||
        card.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    })
  }, [allCatalogCards, deferredCatalogSearch, departmentCatalog, departmentCategory])

  async function handleDownload(format: GradesReportFormat, scope: GradesReportScope = activeTab) {
    setDownloadError(null)
    setDownloadState((current) => ({ ...current, [format]: true }))

    try {
      const result = await downloadGradesReport({
        format,
        stage,
        scope,
        departmentId,
        ...(scope === "projects" ? currentFilters.projects : currentFilters.students),
      })

      downloadBlob(result.blob, result.fileName)
      toast.success(`${format.toUpperCase()} download started`, {
        description: `${roleLabel} ${scope} report for ${formatStageLabel(stage)}.`,
      })
    } catch (error) {
      const message = getErrorMessage(error, `Failed to download ${format.toUpperCase()} report.`)
      setDownloadError(message)
      toast.error("Download failed", { description: message })
    } finally {
      setDownloadState((current) => ({ ...current, [format]: false }))
    }
  }

  function handleRefresh() {
    setDownloadError(null)
    void Promise.all([overviewQuery.refetch(), projectsQuery.refetch(), studentsQuery.refetch()])
  }

  function resetStage(nextStage: GradesStage) {
    setStageAndUrl(nextStage)
  }

  if (!authHydrated) {
    return <LoadingBlock />
  }

  if (!accessToken) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication required</AlertTitle>
        <AlertDescription>Sign in again to load grades analytics and report downloads.</AlertDescription>
      </Alert>
    )
  }

  if (overviewQuery.isLoading && !overviewQuery.data) {
    return <LoadingBlock />
  }

  if (overviewQuery.error && !overviewQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Failed to load overview</AlertTitle>
        <AlertDescription>{getErrorMessage(overviewQuery.error, "Please try again.")}</AlertDescription>
      </Alert>
    )
  }

  const overview = overviewQuery.data

  if (!overview) {
    return null
  }

  const activeScopeSummary = activeTab === "projects" ? projectsQuery.data?.pagination.totalItems : studentsQuery.data?.pagination.totalItems

  if (variant === "coordinator") {
    return (
      <div className="space-y-6 pb-8">
        <Card className="border-none shadow-sm">
          <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active stage</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {STAGES.map((entry) => (
                  <Button
                    key={entry.value}
                    variant={stage === entry.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => resetStage(entry.value)}
                  >
                    {entry.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{overview.weights.isConfigured ? "Weights configured" : "Weights pending"}</Badge>
              <Badge variant="outline">Generated {formatDate(overview.generatedAt)}</Badge>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh data
              </Button>
            </div>
          </CardContent>
        </Card>

        <OverviewMetricGrid overview={overview} />

        <Tabs value={coordinatorView} onValueChange={(value) => setCoordinatorViewAndUrl(value as CoordinatorView)} className="space-y-5">
          <TabsList className="h-auto w-full justify-start overflow-x-auto whitespace-nowrap">
            <TabsTrigger value="generate" className="gap-2 shrink-0"><Zap className="h-4 w-4" /> Generate</TabsTrigger>
            <TabsTrigger value="history" className="gap-2 shrink-0"><FileText className="h-4 w-4" /> History</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 shrink-0"><BarChart3 className="h-4 w-4" /> Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {coordinatorQuickReports.map((report) => (
                <CoordinatorQuickCard
                  key={report.id}
                  icon={report.icon}
                  label={report.label}
                  description={report.description}
                  busy={downloadState[report.format]}
                  dashed={report.dashed}
                  onClick={() => void handleDownload(report.format, report.scope)}
                />
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Star className="h-4 w-4" /> Ready to Download
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    id: "ready-projects",
                    title: "Project workflow export",
                    meta: `${projectsQuery.data?.pagination.totalItems ?? 0} visible project rows`,
                    icon: FolderKanban,
                    format: "excel" as const,
                    scope: "projects" as const,
                  },
                  {
                    id: "ready-students",
                    title: "Student outcomes export",
                    meta: `${studentsQuery.data?.pagination.totalItems ?? 0} visible student rows`,
                    icon: Users,
                    format: "csv" as const,
                    scope: "students" as const,
                  },
                  {
                    id: "ready-summary",
                    title: "Executive PDF snapshot",
                    meta: `${formatStageLabel(stage)} overview and distributions`,
                    icon: FileText,
                    format: "pdf" as const,
                    scope: activeTab,
                  },
                ].map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 hover:border-primary/20 transition-all">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.meta}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      disabled={downloadState[item.format]}
                      onClick={() => void handleDownload(item.format, item.scope)}
                    >
                      {downloadState[item.format] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Export Workspace</CardTitle>
                <CardDescription>
                  Project and student drilldowns stay live, filterable, and ready for export without clearing previous rows while data refreshes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DrilldownWorkspace
                  activeTab={activeTab}
                  onActiveTabChange={setActiveTabAndUrl}
                  projectFilters={projectFilters}
                  onProjectFiltersChange={updateProjectFiltersWithUrl}
                  studentFilters={studentFilters}
                  onStudentFiltersChange={updateStudentFiltersWithUrl}
                  downloadState={downloadState}
                  onDownload={handleDownload}
                  downloadError={downloadError}
                  projectsQuery={projectsQuery}
                  studentsQuery={studentsQuery}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-5">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Weights and Review Status</CardTitle>
                <CardDescription>
                  Advisor {overview.weights.advisorPercentage}% and evaluator {overview.weights.evaluatorPercentage}% weighting for {formatStageLabel(stage)}.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">Weights configuration</p>
                    <Badge className={cn("border", overview.weights.isConfigured ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" : "bg-amber-500/10 text-amber-700 border-amber-500/20")}>
                      {overview.weights.isConfigured ? "Configured" : "Waiting"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Updated {formatDate(overview.weights.updatedAt)}</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="font-medium">Review throughput</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {overview.review.pendingReviewCount} pending, {overview.review.approvedCount} approved, {overview.review.rejectedCount} rejected.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-5 lg:grid-cols-3">
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> Grade Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    {[
                      { label: "Avg Score", value: `${formatNumber(overview.grades.averageFinalGrade)}%` },
                      { label: "Published", value: overview.grades.totalPublishedStudents },
                      { label: "Highest", value: formatNumber(overview.grades.highestFinalGrade) },
                      { label: "Lowest", value: formatNumber(overview.grades.lowestFinalGrade) },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-lg bg-muted/40 py-2">
                        <p className="text-base font-bold text-primary">{metric.value}</p>
                        <p className="text-[10px] text-muted-foreground">{metric.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2"><FolderKanban className="h-4 w-4 text-primary" /> Project Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    {[
                      { label: "Total", value: overview.pipeline.totalProjectGroups },
                      { label: "Ready", value: overview.pipeline.readyForAggregationCount },
                      { label: "Pending Advisor", value: overview.pipeline.waitingForAdvisorCount },
                      { label: "Pending Eval", value: overview.pipeline.waitingForEvaluatorsCount },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-lg bg-muted/40 py-2">
                        <p className="text-base font-bold text-primary">{metric.value}</p>
                        <p className="text-[10px] text-muted-foreground">{metric.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-primary" /> Review Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    {[
                      { label: "Pending", value: overview.review.pendingReviewCount },
                      { label: "Approved", value: overview.review.approvedCount },
                      { label: "Rejected", value: overview.review.rejectedCount },
                      { label: "Rate", value: `${overview.review.approvalRatePercent}%` },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-lg bg-muted/40 py-2">
                        <p className="text-base font-bold text-primary">{metric.value}</p>
                        <p className="text-[10px] text-muted-foreground">{metric.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <DistributionCard title="Letter Grade Distribution" items={letterGradeDistribution} />
              <DistributionCard title="Score Band Distribution" items={scoreBandDistribution} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="relative w-full lg:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports by title, description, or tags..."
                  className="pl-9"
                  value={catalogSearch}
                  onChange={(event) => setCatalogSearchAndUrl(event.target.value)}
                />
              </div>
              <Select value={stage} onValueChange={(value) => resetStage(value as GradesStage)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((entry) => (
                    <SelectItem key={entry.value} value={entry.value}>{entry.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Available Reports",
            value: String(allCatalogCards.length),
            change: `${formatStageLabel(stage)} catalog`,
            icon: FileText,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
          },
          {
            title: "Approval Rate",
            value: `${overview.review.approvalRatePercent}%`,
            change: `${overview.review.pendingReviewCount} pending review`,
            icon: RefreshCw,
            color: "text-green-600",
            bgColor: "bg-green-100",
          },
          {
            title: "Downloads Ready",
            value: String(activeScopeSummary ?? 0),
            change: `Visible ${activeTab} rows`,
            icon: Download,
            color: "text-purple-600",
            bgColor: "bg-purple-100",
          },
          {
            title: "Published Students",
            value: String(overview.grades.totalPublishedStudents),
            change: `${overview.grades.totalFinalizedStudents} finalized`,
            icon: Star,
            color: "text-amber-600",
            bgColor: "bg-amber-100",
          },
        ].map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", stat.bgColor)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={departmentCategory} onValueChange={(value) => setDepartmentCategoryAndUrl(value as DepartmentCategory)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="administrative">Administrative</TabsTrigger>
          <TabsTrigger value="strategic">Strategic</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value={departmentCategory} className="space-y-6">
          {departmentCategory === "all" ? (
            (Object.entries(departmentCatalog) as Array<[Exclude<DepartmentCategory, "all">, ReportCatalogCard[]]>).map(([category, cards]) => {
              const sectionCards = visibleCatalogCards.filter((card) => card.category === category)
              if (sectionCards.length === 0) {
                return null
              }

              return (
                <div key={category} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold capitalize">{category} Reports</h3>
                    <Button variant="ghost" size="sm" onClick={() => setDepartmentCategoryAndUrl(category)}>
                      View All <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sectionCards.map((card) => (
                      <DepartmentReportCard
                        key={card.id}
                        card={card}
                        busy={downloadState[card.format]}
                        onDownload={() => void handleDownload(card.format, card.scope)}
                        onView={() => {
                          setActiveTabAndUrl(card.scope)
                          toast.info(`Live explorer switched to ${card.scope}.`)
                        }}
                      />
                    ))}
                  </div>
                </div>
              )
            })
          ) : visibleCatalogCards.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleCatalogCards.map((card) => (
                <DepartmentReportCard
                  key={card.id}
                  card={card}
                  busy={downloadState[card.format]}
                  onDownload={() => void handleDownload(card.format, card.scope)}
                  onView={() => {
                    setActiveTabAndUrl(card.scope)
                    toast.info(`Live explorer switched to ${card.scope}.`)
                  }}
                />
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              title="No report cards match this search"
              description="Try another search term or switch categories."
            />
          )}
        </TabsContent>
      </Tabs>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                `${overview.review.pendingReviewCount} results still need department-head approval`,
                `${overview.pipeline.readyForAggregationCount} project groups are ready for aggregation`,
                `${overview.grades.totalPublishedStudents} student results are already published`,
              ].map((entry) => (
                <div key={entry} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Download className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{entry}</p>
                    <p className="text-xs text-muted-foreground">Generated from the live {formatStageLabel(stage)} snapshot at {formatDate(overview.generatedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-auto py-3 flex-col items-start" onClick={() => void handleDownload("excel", "projects")}>
                <FileSpreadsheet className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Export Projects</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex-col items-start" onClick={() => void handleDownload("pdf", "students")}>
                <FileBarChart className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Student PDF</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex-col items-start" onClick={() => setActiveTabAndUrl("projects")}>
                <Target className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">View Projects</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex-col items-start" onClick={() => setActiveTabAndUrl("students")}>
                <Users className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">View Students</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <DashboardSectionCard
        title="Live Explorer"
        description="The department-head drilldown stays connected to the same overview stage and export actions shown above."
      >
        <DrilldownWorkspace
          activeTab={activeTab}
          onActiveTabChange={setActiveTabAndUrl}
          projectFilters={projectFilters}
          onProjectFiltersChange={updateProjectFiltersWithUrl}
          studentFilters={studentFilters}
          onStudentFiltersChange={updateStudentFiltersWithUrl}
          downloadState={downloadState}
          onDownload={handleDownload}
          downloadError={downloadError}
          projectsQuery={projectsQuery}
          studentsQuery={studentsQuery}
        />
      </DashboardSectionCard>
    </div>
  )
}