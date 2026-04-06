"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import PageHeader from "@/components/shared/PageHeader"
import StatCard from "@/components/shared/StatCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAdvisorSubmittedDocuments } from "@/lib/hooks/useAdvisor"
import type { AdvisorSubmittedDocumentItem } from "@/lib/types/advisor"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  ArrowLeft,
  Archive,
  BookOpen,
  CheckCircle,
  ClipboardCheck,
  Clock,
  Download,
  ExternalLink,
  Eye,
  File as FileIcon,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Layers,
  Paperclip,
  Search,
  Shield,
  Upload,
  Video as VideoIcon,
} from "lucide-react"

import { RUBRIC_TOTAL_MAX_PERCENT } from "./advisor-evaluator-shared"

type DocumentTypeFilter = "all" | "pdf" | "doc" | "image" | "video" | "archive" | "file"
type DocumentStatusFilter = "all" | "approved" | "pending_review" | "revision_requested"

function formatDateTime(value?: string | null) {
  if (!value) return "Unknown"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unknown"

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatBytes(bytes?: number | null) {
  const value = Number(bytes ?? 0)
  if (!Number.isFinite(value) || value <= 0) return "Unknown size"

  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`
  }

  if (value >= 1024) {
    return `${Math.round(value / 1024)} KB`
  }

  return `${value} B`
}

function getUploaderName(document: AdvisorSubmittedDocumentItem) {
  return [document.uploadedBy.firstName, document.uploadedBy.lastName].filter(Boolean).join(" ") || document.uploadedBy.email
}

function getDocumentTypeKey(document: AdvisorSubmittedDocumentItem): Exclude<DocumentTypeFilter, "all"> {
  const mimeType = document.mimeType?.trim().toLowerCase() ?? ""
  const resourceType = document.resourceType?.trim().toLowerCase() ?? ""
  const lowerName = document.documentName.trim().toLowerCase()

  if (mimeType.includes("pdf") || lowerName.endsWith(".pdf")) return "pdf"
  if (mimeType.includes("wordprocessingml") || mimeType.includes("msword") || lowerName.endsWith(".doc") || lowerName.endsWith(".docx")) {
    return "doc"
  }
  if (mimeType.startsWith("image/") || resourceType === "image") return "image"
  if (mimeType.startsWith("video/") || resourceType === "video") return "video"
  if (mimeType.includes("zip") || mimeType.includes("archive") || lowerName.endsWith(".zip") || lowerName.endsWith(".rar")) {
    return "archive"
  }

  return "file"
}

function getDocumentTypeLabel(document: AdvisorSubmittedDocumentItem) {
  switch (getDocumentTypeKey(document)) {
    case "pdf":
      return "PDF"
    case "doc":
      return "DOC"
    case "image":
      return "Image"
    case "video":
      return "Video"
    case "archive":
      return "Archive"
    default:
      return "File"
  }
}

function getDocumentIcon(document: AdvisorSubmittedDocumentItem) {
  switch (getDocumentTypeKey(document)) {
    case "pdf":
      return <FileText className="h-5 w-5 text-red-500" />
    case "doc":
      return <FileIcon className="h-5 w-5 text-blue-500" />
    case "image":
      return <ImageIcon className="h-5 w-5 text-green-500" />
    case "video":
      return <VideoIcon className="h-5 w-5 text-primary" />
    case "archive":
      return <Archive className="h-5 w-5 text-amber-500" />
    default:
      return <FileIcon className="h-5 w-5 text-muted-foreground" />
  }
}

function getSubmittedDocumentStatusKey(status?: string | null): Exclude<DocumentStatusFilter, "all"> {
  const normalized = status?.trim().toUpperCase()

  switch (normalized) {
    case "APPROVED":
      return "approved"
    case "REVISION_REQUIRED":
    case "REVISION_REQUESTED":
      return "revision_requested"
    default:
      return "pending_review"
  }
}

function getSubmittedDocumentStatusMeta(status?: string | null) {
  switch (getSubmittedDocumentStatusKey(status)) {
    case "approved":
      return {
        label: "Approved",
        className: "bg-success/10 text-success border-success/20",
        icon: CheckCircle,
      }
    case "revision_requested":
      return {
        label: "Revision Requested",
        className: "bg-destructive/10 text-destructive border-destructive/20",
        icon: AlertCircle,
      }
    default:
      return {
        label: "Pending Review",
        className: "bg-warning/10 text-warning border-warning/20",
        icon: Clock,
      }
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return "Something went wrong while loading documents."
}

function normalizeProjectQuery(rawProjectQuery: string | null) {
  const value = rawProjectQuery?.trim() ?? ""
  if (!value) return ""

  const normalized = value.toLowerCase()
  if (normalized === "undefined" || normalized === "null" || normalized === "all") {
    return ""
  }

  return value
}

function matchesProjectQuery(document: AdvisorSubmittedDocumentItem, rawProjectQuery: string) {
  const projectQuery = rawProjectQuery.trim().toLowerCase()
  if (!projectQuery) return true

  const projectId = document.project.id.trim().toLowerCase()
  const projectTitle = document.project.title.trim().toLowerCase()

  return projectId === projectQuery || projectTitle === projectQuery || projectTitle.includes(projectQuery)
}

export type AdvisorDocumentsPageVariant = "advisor" | "evaluator"

export function AdvisorDocumentsPage({ variant = "advisor" }: { variant?: AdvisorDocumentsPageVariant }) {
  const isEvaluator = variant === "evaluator"
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterType, setFilterType] = React.useState<DocumentTypeFilter>("all")
  const [filterStatus, setFilterStatus] = React.useState<DocumentStatusFilter>("all")
  const [selectedDocument, setSelectedDocument] = React.useState<AdvisorSubmittedDocumentItem | null>(null)

  const submittedDocumentsQuery = useAdvisorSubmittedDocuments()

  const projectQuery = React.useMemo(
    () => normalizeProjectQuery(searchParams.get("project")),
    [searchParams],
  )

  const scopedDocuments = React.useMemo(() => {
    const documents = submittedDocumentsQuery.data?.documents ?? []
    if (!projectQuery) return documents

    return documents.filter((document) => matchesProjectQuery(document, projectQuery))
  }, [projectQuery, submittedDocumentsQuery.data?.documents])

  const submittedDocumentsSummary = React.useMemo(() => {
    if (!projectQuery) {
      return submittedDocumentsQuery.data?.summary ?? {
        totalSubmittedDocuments: 0,
        approved: 0,
        pendingReview: 0,
        revisionRequested: 0,
      }
    }

    return scopedDocuments.reduce(
      (summary, document) => {
        summary.totalSubmittedDocuments += 1

        switch (getSubmittedDocumentStatusKey(document.status)) {
          case "approved":
            summary.approved += 1
            break
          case "revision_requested":
            summary.revisionRequested += 1
            break
          default:
            summary.pendingReview += 1
            break
        }

        return summary
      },
      {
        totalSubmittedDocuments: 0,
        approved: 0,
        pendingReview: 0,
        revisionRequested: 0,
      },
    )
  }, [projectQuery, scopedDocuments, submittedDocumentsQuery.data?.summary])

  const filteredDocuments = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return scopedDocuments.filter((document) => {
      const matchesSearch =
        !term ||
        document.documentName.toLowerCase().includes(term) ||
        document.project.title.toLowerCase().includes(term) ||
        document.group.name.toLowerCase().includes(term) ||
        document.milestone.title.toLowerCase().includes(term) ||
        getUploaderName(document).toLowerCase().includes(term)

      const matchesType = filterType === "all" || getDocumentTypeKey(document) === filterType
      const matchesStatus = filterStatus === "all" || getSubmittedDocumentStatusKey(document.status) === filterStatus

      return matchesSearch && matchesType && matchesStatus
    })
  }, [filterStatus, filterType, scopedDocuments, searchTerm])

  const filtersInner = (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
      <div className="relative flex-1">
        <Search
          className={cn(
            "absolute left-3 text-muted-foreground",
            isEvaluator ? "top-1/2 h-4 w-4 -translate-y-1/2" : "top-3 h-4 w-4",
          )}
          aria-hidden
        />
        <Input
          placeholder={isEvaluator ? "Search file, project, milestone, or group..." : "Search documents, projects, milestones, or groups..."}
          className="pl-9"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          aria-label="Search documents"
        />
      </div>
      <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[320px]">
        <div>
          <Label htmlFor="doc-filter-type" className="sr-only">
            Type
          </Label>
          <Select value={filterType} onValueChange={(value) => setFilterType(value as DocumentTypeFilter)}>
            <SelectTrigger id="doc-filter-type" className="w-full">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="doc">Word</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="archive">Archive</SelectItem>
              <SelectItem value="file">Other files</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="doc-filter-status" className="sr-only">
            Status
          </Label>
          <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as DocumentStatusFilter)}>
            <SelectTrigger id="doc-filter-status" className="w-full">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending_review">Pending review</SelectItem>
              <SelectItem value="revision_requested">Revision requested</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )

  const documentsTable = (
    <Card className={cn(isEvaluator && "overflow-hidden border-border/80 shadow-sm")}>
      <CardHeader className={cn(isEvaluator && "border-b border-border/50 bg-muted/10", !isEvaluator && "pb-3")}>
        <CardTitle className="text-lg">
          Documents ({filteredDocuments.length}
          {isEvaluator && (searchTerm.trim() || filterType !== "all" || filterStatus !== "all") ? " filtered" : ""})
        </CardTitle>
        {isEvaluator ? (
          <CardDescription>Read-only review library backed by live advisor submissions.</CardDescription>
        ) : (
          <CardDescription>Milestone documents submitted by your supervised groups.</CardDescription>
        )}
      </CardHeader>
      <CardContent className={cn(isEvaluator && "p-0")}>
        {submittedDocumentsQuery.isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-xl border bg-muted/20 px-4 py-4">
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="mt-3 h-3 w-full animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : submittedDocumentsQuery.isError ? (
          <div className="p-6">
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm text-destructive">
              {getErrorMessage(submittedDocumentsQuery.error)}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Uploaded by</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document) => {
                  const statusMeta = getSubmittedDocumentStatusMeta(document.status)
                  const StatusIcon = statusMeta.icon

                  return (
                    <TableRow key={document.submissionId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getDocumentIcon(document)}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium leading-snug">{document.documentName}</p>
                              <Badge variant="outline" className="text-xs">
                                {getDocumentTypeLabel(document)}
                              </Badge>
                            </div>
                            <p className="line-clamp-2 text-sm text-muted-foreground">
                              {document.milestone.title}
                              {document.review.latestFeedbackMessage ? ` • Latest feedback: ${document.review.latestFeedbackMessage}` : ""}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{document.project.title}</p>
                          <p className="text-sm text-muted-foreground">{document.group.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{getUploaderName(document)}</p>
                          <p className="text-xs text-muted-foreground">{document.uploadedBy.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${statusMeta.className}`}>
                          <StatusIcon className="mr-1 h-3.5 w-3.5" />
                          {statusMeta.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatBytes(document.sizeBytes)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDateTime(document.uploadedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(isEvaluator && "h-9 rounded-lg")}
                            onClick={() => setSelectedDocument(document)}
                            aria-label="Open document details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button asChild variant="outline" size="sm" className={cn(isEvaluator && "h-9 rounded-lg")}>
                            <a href={document.fileUrl} target="_blank" rel="noreferrer" aria-label="Open document">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button asChild variant="outline" size="sm" className={cn(isEvaluator && "h-9 rounded-lg")}>
                            <a href={document.fileUrl} target="_blank" rel="noreferrer" download={document.documentName} aria-label="Download document">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-14 text-center">
                      <p className="font-medium text-foreground">No documents match</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {isEvaluator ? "Clear search or filters to see the full library." : "Try adjusting filters."}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          setSearchTerm("")
                          setFilterType("all")
                          setFilterStatus("all")
                        }}
                      >
                        Reset filters
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (isEvaluator) {
    return (
      <>
        <div className="flex w-full min-w-0 flex-col gap-6 pb-10 animate-in fade-in duration-300 sm:gap-8 lg:gap-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1 space-y-4">
              <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1.5 text-muted-foreground" asChild>
                <Link href="/dashboard/advisor/evaluator">
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Evaluator overview
                </Link>
              </Button>
              <PageHeader
                title="Document library"
                description="Cross-project files for review while you evaluate, using the same live submission repository as the advisor shell."
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
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <Link href="/dashboard/advisor/evaluator/projects">
                  <FolderKanban className="h-4 w-4" aria-hidden />
                  Projects
                </Link>
              </Button>
            </div>
          </div>

          <section aria-label="Summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total files"
              value={submittedDocumentsSummary.totalSubmittedDocuments}
              subtitle="Live repository"
              icon={FileText}
              iconClassName="bg-primary/10 text-primary"
            />
            <StatCard
              title="Approved"
              value={submittedDocumentsSummary.approved}
              subtitle="Ready reference"
              icon={CheckCircle}
              iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              title="Pending review"
              value={submittedDocumentsSummary.pendingReview}
              subtitle="May need advisor action"
              icon={Eye}
              iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            />
            <StatCard
              title="Showing"
              value={filteredDocuments.length}
              subtitle={searchTerm.trim() || filterType !== "all" || filterStatus !== "all" ? "After filters" : "All rows"}
              icon={Search}
              iconClassName="bg-violet-500/10 text-violet-600 dark:text-violet-400"
            />
          </section>

          <section aria-label="Document review guide" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-12 xl:gap-5">
            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-primary/[0.07] via-background to-background p-5 shadow-sm sm:col-span-2 xl:col-span-7">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" aria-hidden />
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Layers className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 space-y-2 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">Suggested reading order</p>
                  <p>
                    Proposal or charter first, then milestone artifacts, then deep PDFs or demo media. Filter by
                    <strong className="text-foreground"> pending review </strong>
                    before scoring so reference files do not dilute the live queue.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm xl:col-span-5">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">Sensitivity &amp; scope</p>
                  <p>
                    Treat uploads as student records. Files here are live milestone submissions, so timestamp and latest
                    feedback matter more than filename alone.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/20 p-5 sm:col-span-2 xl:col-span-12">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <p className="max-w-3xl text-sm text-muted-foreground">
                  <strong className="text-foreground">Status column:</strong> pending review means the submission is still awaiting advisor action. Revision requested means a gap is already known, so keep rubric comments additive instead of repetitive.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button variant="secondary" size="sm" className="gap-2 rounded-full" asChild>
                    <Link href="/dashboard/advisor/evaluator/rubric">
                      <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
                      {RUBRIC_TOTAL_MAX_PERCENT}% rubric
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 rounded-full" asChild>
                    <Link href="/dashboard/advisor/evaluator/pending">
                      <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden />
                      Pending queue
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <div className="min-w-0 space-y-6">
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="border-b border-border/50 bg-muted/10 pb-3">
                <CardTitle className="text-base">Find documents</CardTitle>
                <CardDescription>Filter by file name, milestone, type, or review status.</CardDescription>
              </CardHeader>
              <CardContent className="pt-5">{filtersInner}</CardContent>
            </Card>
            {documentsTable}
            <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/15 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Advisor-owned actions:</span> review decisions and upload flows stay in the advisor shell.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/advisor/documents">
                    <FileText className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                    Advisor hub
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/advisor/upload">
                    <Upload className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                    Upload
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        <DocumentDetailsDialog document={selectedDocument} onOpenChange={(open) => !open && setSelectedDocument(null)} />
      </>
    )
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Document Repository</h1>
            <p className="text-sm text-muted-foreground">Review milestone documents and submission feedback from your supervised groups.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{submittedDocumentsSummary.totalSubmittedDocuments}</p>
                  <p className="text-sm text-muted-foreground">Total Documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{submittedDocumentsSummary.approved}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{submittedDocumentsSummary.pendingReview}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{submittedDocumentsSummary.revisionRequested}</p>
                  <p className="text-sm text-muted-foreground">Revision Requested</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">{filtersInner}</CardContent>
        </Card>

        {documentsTable}
      </div>
      <DocumentDetailsDialog document={selectedDocument} onOpenChange={(open) => !open && setSelectedDocument(null)} />
    </>
  )
}

function DocumentDetailsDialog({
  document,
  onOpenChange,
}: {
  document: AdvisorSubmittedDocumentItem | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={Boolean(document)} onOpenChange={onOpenChange}>
      {document ? (
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {document.documentName}
            </DialogTitle>
            <DialogDescription>
              {document.project.title} • {document.group.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Status",
                  value: getSubmittedDocumentStatusMeta(document.status).label,
                },
                {
                  label: "Document Type",
                  value: getDocumentTypeLabel(document),
                },
                {
                  label: "Uploaded",
                  value: formatDateTime(document.uploadedAt),
                },
                {
                  label: "Approved",
                  value: formatDateTime(document.approvedAt),
                },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border bg-muted/20 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
              <div className="space-y-4">
                <div className="rounded-xl border bg-card px-4 py-4">
                  <h3 className="text-sm font-semibold text-foreground">Milestone Context</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Milestone:</span> {document.milestone.title}</p>
                    <p><span className="text-muted-foreground">Description:</span> {document.milestone.description || "No description provided."}</p>
                    <p><span className="text-muted-foreground">Due Date:</span> {formatDateTime(document.milestone.dueDate)}</p>
                    <p><span className="text-muted-foreground">Submitted At:</span> {formatDateTime(document.milestone.submittedAt)}</p>
                  </div>
                </div>

                <div className="rounded-xl border bg-card px-4 py-4">
                  <h3 className="text-sm font-semibold text-foreground">Latest Review Feedback</h3>
                  <div className="mt-3 space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      {document.review.latestFeedbackMessage || "No feedback has been recorded yet for this submission."}
                    </p>
                    {document.review.latestFeedbackAuthor ? (
                      <div className="rounded-lg bg-muted/30 px-3 py-3">
                        <p className="font-medium text-foreground">
                          {[document.review.latestFeedbackAuthor.firstName, document.review.latestFeedbackAuthor.lastName]
                            .filter(Boolean)
                            .join(" ") || document.review.latestFeedbackAuthor.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {document.review.latestFeedbackAuthorRole || "Reviewer"}
                          {document.review.latestFeedbackAt ? ` • ${formatDateTime(document.review.latestFeedbackAt)}` : ""}
                        </p>
                      </div>
                    ) : null}
                    {document.review.latestFeedbackAttachmentUrl ? (
                      <Button asChild variant="outline" size="sm">
                        <a href={document.review.latestFeedbackAttachmentUrl} target="_blank" rel="noreferrer">
                          <Paperclip className="mr-2 h-4 w-4" />
                          {document.review.latestFeedbackAttachmentFileName || "Open feedback attachment"}
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border bg-card px-4 py-4">
                  <h3 className="text-sm font-semibold text-foreground">Submission Details</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Uploaded By:</span> {getUploaderName(document)}</p>
                    <p><span className="text-muted-foreground">Email:</span> {document.uploadedBy.email}</p>
                    <p><span className="text-muted-foreground">File Size:</span> {formatBytes(document.sizeBytes)}</p>
                    <p><span className="text-muted-foreground">Mime Type:</span> {document.mimeType}</p>
                    <p><span className="text-muted-foreground">Feedback Count:</span> {document.review.feedbackCount}</p>
                    <p><span className="text-muted-foreground">Submission Status:</span> {document.submissionStatus || "Unknown"}</p>
                  </div>
                </div>

                <div className="rounded-xl border bg-card px-4 py-4">
                  <h3 className="text-sm font-semibold text-foreground">Actions</h3>
                  <div className="mt-3 flex flex-col gap-2">
                    <Button asChild>
                      <a href={document.fileUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" /> Open Document
                      </a>
                    </Button>
                    <Button asChild variant="outline">
                      <a href={document.fileUrl} target="_blank" rel="noreferrer" download={document.documentName}>
                        <Download className="mr-2 h-4 w-4" /> Download Document
                      </a>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/dashboard/advisor/reviews">
                        <ClipboardCheck className="mr-2 h-4 w-4" /> Open Review Queue
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}

export default AdvisorDocumentsPage