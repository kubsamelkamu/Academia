"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileText,
  Filter,
  MessageCircle,
  Search,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import { useDocumentTemplate, useDocumentTemplatesList } from "@/lib/hooks/use-document-templates"
import { useMyGroupProposals } from "@/lib/hooks/use-project-proposals"
import { useAuthStore } from "@/store/auth-store"
import type { DocumentTemplateType } from "@/types/document-templates"
import type {
  ProjectProposal,
  ProposalDocument,
  ProposalMilestoneSubmission,
  ProposalMilestoneSubmissionFeedback,
  ProposalProjectMilestone,
} from "@/types/project-proposals"

type SubmissionStatus = "approved" | "reviewed" | "pending"

interface FeedbackComment {
  id: string
  author: string
  authorRole?: string
  text: string
  date: string
  resolved: boolean
  attachmentName?: string
  attachmentUrl?: string
  attachmentSize?: string
}

interface StudentSubmission {
  id: string
  name: string
  size: string
  uploadedAt: string
  milestone: string
  source: "proposal" | "milestone"
  submittedBy?: string
  reviewedBy?: string
  reviewedAt?: string
  details?: string
  status: SubmissionStatus
  comments: FeedbackComment[]
  url?: string
}

interface MilestoneStatusItem {
  id: string
  title: string
  status: SubmissionStatus
  dueDate?: string
  submittedAt?: string
  submissionCount: number
}

const templateTypes: Array<{ label: string; value: DocumentTemplateType | null }> = [
  { label: "All", value: null },
  { label: "SRS", value: "SRS" },
  { label: "SDD", value: "SDD" },
  { label: "REPORT", value: "REPORT" },
  { label: "OTHER", value: "OTHER" },
]

function statusBadge(status: SubmissionStatus) {
  if (status === "approved") {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Approved
      </Badge>
    )
  }
  if (status === "reviewed") {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
        <AlertCircle className="h-3 w-3 mr-1" />
        Needs Revision
      </Badge>
    )
  }
  return (
    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
      <Clock3 className="h-3 w-3 mr-1" />
      Pending Review
    </Badge>
  )
}


function formatDate(iso: string | null | undefined) {
  if (!iso) return "-"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString()
}

function formatFileSize(sizeBytes: number | null | undefined) {
  if (typeof sizeBytes !== "number" || Number.isNaN(sizeBytes) || sizeBytes <= 0) return "-"

  const units = ["B", "KB", "MB", "GB"]
  let value = sizeBytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  const digits = value >= 10 || unitIndex === 0 ? 0 : 1
  return `${value.toFixed(digits)} ${units[unitIndex]}`
}

function normalizeStatus(value: unknown): string {
  return String(value ?? "").trim().toUpperCase()
}

function formatPersonName(firstName?: string | null, lastName?: string | null, email?: string | null) {
  return `${firstName ?? ""} ${lastName ?? ""}`.trim() || email || "Advisor"
}

function initialLetters(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function proposalToSubmissionStatus(status: unknown): SubmissionStatus {
  const normalized = normalizeStatus(status)
  if (normalized === "APPROVED") return "approved"
  if (normalized === "REJECTED") return "reviewed"
  return "pending"
}

function milestoneSubmissionToStatus(status: unknown): SubmissionStatus {
  const normalized = normalizeStatus(status)
  if (normalized === "APPROVED") return "approved"
  if (normalized === "REJECTED" || normalized === "CHANGES_REQUESTED" || normalized === "NEEDS_REVISION") {
    return "reviewed"
  }
  return "pending"
}

function getProposalPdfDocument(proposal: ProjectProposal): ProposalDocument | null {
  const docs = proposal.documents ?? []
  const match = docs.find((doc) => String(doc.key ?? "").toLowerCase() === "proposal.pdf")
  return match ?? docs[0] ?? null
}

function toProposalFeedbackComments(proposal: ProjectProposal): FeedbackComment[] {
  const text = typeof proposal.feedback === "string" ? proposal.feedback.trim() : ""
  if (!text) return []

  const advisor = proposal.advisor
  const author = formatPersonName(advisor?.firstName, advisor?.lastName, advisor?.email)

  return [
    {
      id: `feedback:${proposal.id}`,
      author,
      authorRole: "Advisor",
      text,
      date: formatDate(proposal.updatedAt ?? proposal.createdAt ?? null),
      resolved: false,
    },
  ]
}

function getMilestoneDisplayLabel(milestone: ProposalProjectMilestone, index: number) {
  const title = milestone.title?.trim() || `Milestone ${index + 1}`
  return `${index + 1}. ${title}`
}

function toMilestoneFeedbackComments(
  feedbacks: ProposalMilestoneSubmissionFeedback[] | null | undefined
): FeedbackComment[] {
  const comments: FeedbackComment[] = []

  for (const [index, feedback] of (feedbacks ?? []).entries()) {
    const text = feedback.message?.trim()
    if (!text) continue

    const author = feedback.author
    comments.push({
      id: feedback.id || `milestone-feedback:${index}`,
      author: formatPersonName(author?.firstName, author?.lastName, author?.email),
      authorRole: feedback.authorRole ?? undefined,
      text,
      date: formatDate(feedback.createdAt ?? null),
      resolved: false,
      attachmentName: feedback.attachmentFileName ?? undefined,
      attachmentUrl: feedback.attachmentUrl ?? undefined,
      attachmentSize: formatFileSize(feedback.attachmentSizeBytes ?? null),
    })
  }

  return comments.sort((a, b) => {
      const aTime = Date.parse(a.date)
      const bTime = Date.parse(b.date)
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0)
    })
}

function toProposalSubmission(proposal: ProjectProposal): StudentSubmission {
  const doc = getProposalPdfDocument(proposal)
  const uploadedAt = doc?.uploadedAt ?? proposal.updatedAt ?? proposal.createdAt ?? new Date().toISOString()
  const fileName = doc?.originalName?.trim() || proposal.title?.trim() || "Project Proposal"

  return {
    id: proposal.id,
    name: fileName,
    size: formatFileSize(doc?.sizeBytes ?? null),
    uploadedAt,
    milestone: "Proposal",
    source: "proposal",
    submittedBy: formatPersonName(
      proposal.submitter?.firstName,
      proposal.submitter?.lastName,
      proposal.submitter?.email
    ),
    reviewedBy: proposal.advisor
      ? formatPersonName(proposal.advisor.firstName, proposal.advisor.lastName, proposal.advisor.email)
      : undefined,
    reviewedAt: proposal.updatedAt ?? undefined,
    details: proposal.title?.trim() || undefined,
    status: proposalToSubmissionStatus(proposal.status),
    comments: toProposalFeedbackComments(proposal),
    url: doc?.url,
  }
}

function toMilestoneSubmission(
  submission: ProposalMilestoneSubmission,
  milestone: ProposalProjectMilestone,
  milestoneIndex: number
): StudentSubmission {
  const uploadedAt = submission.createdAt ?? milestone.submittedAt ?? milestone.updatedAt ?? new Date().toISOString()

  return {
    id: `milestone-submission:${submission.id}`,
    name: submission.fileName?.trim() || milestone.title?.trim() || "Milestone Submission",
    size: formatFileSize(submission.sizeBytes ?? null),
    uploadedAt,
    milestone: getMilestoneDisplayLabel(milestone, milestoneIndex),
    source: "milestone",
    submittedBy: submission.uploadedBy
      ? formatPersonName(submission.uploadedBy.firstName, submission.uploadedBy.lastName, submission.uploadedBy.email)
      : undefined,
    reviewedBy: submission.approvedBy
      ? formatPersonName(submission.approvedBy.firstName, submission.approvedBy.lastName, submission.approvedBy.email)
      : undefined,
    reviewedAt: submission.approvedAt ?? undefined,
    details: milestone.description?.trim() || undefined,
    status: milestoneSubmissionToStatus(submission.status ?? milestone.status),
    comments: toMilestoneFeedbackComments(submission.feedbacks),
    url: submission.fileUrl ?? undefined,
  }
}

function getLatestLinkedProposal(proposals: ProjectProposal[]): ProjectProposal | null {
  const linked = proposals.filter((proposal) => proposal.project?.id)
  if (!linked.length) return null

  return linked
    .slice()
    .sort((a, b) => {
      const aTime = Date.parse(String(a.updatedAt ?? a.submittedAt ?? a.createdAt ?? ""))
      const bTime = Date.parse(String(b.updatedAt ?? b.submittedAt ?? b.createdAt ?? ""))
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0)
    })[0] ?? null
}

function getMilestoneSubmissions(proposal: ProjectProposal): StudentSubmission[] {
  const milestones = proposal.project?.milestones ?? []

  return milestones.flatMap((milestone, index) => {
    const submissions = milestone.submissions ?? []
    return submissions.map((submission) => toMilestoneSubmission(submission, milestone, index))
  })
}

function getMilestoneStatusItems(proposal: ProjectProposal | null): MilestoneStatusItem[] {
  if (!proposal) return []

  const milestones = proposal.project?.milestones ?? []

  return milestones.map((milestone, index) => {
    const submissions = milestone.submissions ?? []
    const latestSubmission = submissions
      .slice()
      .sort((a, b) => {
        const aTime = Date.parse(String(a.createdAt ?? ""))
        const bTime = Date.parse(String(b.createdAt ?? ""))
        return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0)
      })[0]

    return {
      id: milestone.id,
      title: getMilestoneDisplayLabel(milestone, index),
      status: submissions.length
        ? milestoneSubmissionToStatus(latestSubmission?.status ?? milestone.status)
        : proposalToSubmissionStatus(milestone.status),
      dueDate: milestone.dueDate ?? undefined,
      submittedAt: latestSubmission?.createdAt ?? milestone.submittedAt ?? undefined,
      submissionCount: submissions.length,
    }
  })
}

export function StudentSubmissionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const departmentId = useAuthStore((s) => s.user?.departmentId)
  const accessToken = useAuthStore((s) => s.accessToken)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [templateSearch, setTemplateSearch] = useState("")
  const [templateTypeFilter, setTemplateTypeFilter] = useState<DocumentTemplateType | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<StudentSubmission | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  const myGroupProposalsQuery = useMyGroupProposals(Boolean(accessToken))
  const latestLinkedProposal = useMemo(() => {
    const items = myGroupProposalsQuery.data ?? []
    return getLatestLinkedProposal(items)
  }, [myGroupProposalsQuery.data])

  const submissions = useMemo<StudentSubmission[]>(() => {
    const items = myGroupProposalsQuery.data ?? []

    const proposalSubmissions = items
      .slice()
      .sort((a, b) => {
        const aTime = Date.parse(String(a.updatedAt ?? a.submittedAt ?? a.createdAt ?? ""))
        const bTime = Date.parse(String(b.updatedAt ?? b.submittedAt ?? b.createdAt ?? ""))
        return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0)
      })
      .map(toProposalSubmission)

    const milestoneSubmissions = latestLinkedProposal ? getMilestoneSubmissions(latestLinkedProposal) : []

    return [...proposalSubmissions, ...milestoneSubmissions].sort((a, b) => {
      const aTime = Date.parse(String(a.uploadedAt ?? ""))
      const bTime = Date.parse(String(b.uploadedAt ?? ""))
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0)
    })
  }, [latestLinkedProposal, myGroupProposalsQuery.data])
  const milestoneStatusItems = useMemo(() => getMilestoneStatusItems(latestLinkedProposal), [latestLinkedProposal])
  const templatesQuery = useDocumentTemplatesList(departmentId, {
    page: 1,
    limit: 10,
    isActive: true,
    search: templateSearch.trim() || undefined,
    type: templateTypeFilter ?? undefined,
  })
  const templateDetailQuery = useDocumentTemplate(departmentId, selectedTemplateId, {
    enabled: Boolean(selectedTemplateId),
  })

  const filtered = useMemo(() => {
    return submissions.filter((doc) => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.milestone.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = statusFilter === "all" || doc.status === statusFilter
      return matchesSearch && matchesFilter
    })
  }, [searchTerm, statusFilter, submissions])

  const stats = useMemo(
    () => ({
      total: submissions.length,
      withFeedback: submissions.filter((d) => d.comments.length > 0).length,
      pending: submissions.filter((d) => d.status === "pending").length,
      approved: submissions.filter((d) => d.status === "approved").length,
    }),
    [submissions]
  )

  useEffect(() => {
    const focusId = searchParams.get("focus")?.trim()
    if (!focusId) return

    const target = submissions.find((submission) => submission.id === focusId)
    if (!target) return

    const id = window.setTimeout(() => {
      setSelectedDoc((current) => (current?.id === target.id ? current : target))
    }, 0)
    return () => window.clearTimeout(id)
  }, [searchParams, submissions])

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
            Submissions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload, manage, and track feedback for your project documents.
          </p>
        </div>
        <Button
          className="w-full gap-2 sm:w-auto"
          onClick={() => router.push("/dashboard/student/upload-documents")}
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="px-3 pb-1 pt-3 sm:pb-2 sm:px-6 sm:pt-6">
            <CardDescription>Total Documents</CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0 sm:px-6 sm:pb-6">
            <p className="text-lg font-bold sm:text-2xl">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="px-3 pb-1 pt-3 sm:pb-2 sm:px-6 sm:pt-6">
            <CardDescription>With Feedback</CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0 sm:px-6 sm:pb-6">
            <p className="text-lg font-bold sm:text-2xl">{stats.withFeedback}</p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="px-3 pb-1 pt-3 sm:pb-2 sm:px-6 sm:pt-6">
            <CardDescription>Pending Review</CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0 sm:px-6 sm:pb-6">
            <p className="text-lg font-bold text-yellow-600 sm:text-2xl">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="px-3 pb-1 pt-3 sm:pb-2 sm:px-6 sm:pt-6">
            <CardDescription>Approved</CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0 sm:px-6 sm:pb-6">
            <p className="text-lg font-bold text-green-600 sm:text-2xl">{stats.approved}</p>
          </CardContent>
        </Card>
      </div>

      {milestoneStatusItems.length ? (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>Milestone Sequence</CardTitle>
            <CardDescription>
              Track each milestone status even when no submission has been uploaded yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {milestoneStatusItems.map((milestone) => (
              <div
                key={milestone.id}
                className="rounded-lg border bg-muted/20 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{milestone.title}</p>
                    {statusBadge(milestone.status)}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Due {formatDate(milestone.dueDate ?? null)}
                    {milestone.submittedAt ? ` • Last submitted ${formatDate(milestone.submittedAt)}` : " • No submission yet"}
                  </p>
                </div>
                <Badge variant="outline">
                  {milestone.submissionCount} submission{milestone.submissionCount === 1 ? "" : "s"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl border bg-muted/40 p-1 sm:max-w-[420px]">
          <TabsTrigger value="documents">My Documents</TabsTrigger>
          <TabsTrigger value="templates">Templates & Guidelines</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by document name or milestone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative w-full sm:w-[190px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
              >
                <option value="all">All</option>
                <option value="pending">Pending Review</option>
                <option value="reviewed">Needs Revision</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>

          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>All Documents</span>
                <span className="text-sm text-muted-foreground font-normal">{filtered.length} items</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filtered.map((doc) => {
                const unresolved = doc.comments.filter((c) => !c.resolved).length
                const latestComment = doc.comments[0]
                return (
                  <div
                    key={doc.id}
                    className="flex flex-col justify-between gap-3 rounded-lg border bg-muted/30 p-3 sm:gap-4 sm:p-4 xl:flex-row xl:items-center"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium break-words">{doc.name}</p>
                          <Badge variant="outline">{doc.source === "proposal" ? "Proposal" : "Milestone"}</Badge>
                          {statusBadge(doc.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {doc.size} • {doc.milestone} • {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                        {latestComment ? (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                            Latest feedback: {latestComment.text}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center xl:w-auto xl:justify-end">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setSelectedDoc(doc)}>
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Feedback{unresolved > 0 ? ` (${unresolved})` : ""}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-full sm:h-9 sm:w-9"
                        onClick={() => {
                          if (doc.url) {
                            const anchor = document.createElement("a")
                            anchor.href = doc.url
                            anchor.target = "_blank"
                            anchor.rel = "noreferrer"
                            anchor.download = ""
                            document.body.appendChild(anchor)
                            anchor.click()
                            anchor.remove()
                            return
                          }
                          toast.info("Download is not available for this item")
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle>Templates & Guidelines</CardTitle>
              <CardDescription>Download active document templates from your department.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates by title..."
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {templateTypes.map((typeOption) => (
                    <Button
                      key={typeOption.label}
                      type="button"
                      size="sm"
                      variant={templateTypeFilter === typeOption.value ? "secondary" : "outline"}
                      onClick={() => setTemplateTypeFilter(typeOption.value)}
                    >
                      {typeOption.label}
                    </Button>
                  ))}

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setTemplateSearch("")
                      setTemplateTypeFilter(null)
                    }}
                    disabled={!templateSearch.trim() && templateTypeFilter === null}
                  >
                    Reset
                  </Button>
                </div>
              </div>

              {!departmentId ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Your account is not linked to a department yet, so templates are not available.
                </div>
              ) : templatesQuery.isLoading ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Loading department templates...
                </div>
              ) : templatesQuery.isError ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-destructive">
                  {templatesQuery.error.message}
                </div>
              ) : !templatesQuery.data?.templates.length ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No templates match your current filters.
                </div>
              ) : (
                templatesQuery.data.templates.map((template) => {
                  const firstFile = template.files[0]

                  return (
                    <div key={template.templateId} className="rounded-lg border p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{template.title}</p>
                            <Badge variant="outline">{template.type}</Badge>
                          </div>
                          {template.description ? (
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          ) : null}
                          <p className="text-xs text-muted-foreground">
                            {template.files.length} file{template.files.length === 1 ? "" : "s"} • Updated {formatDate(template.updatedAt)}
                          </p>
                          {firstFile ? (
                            <p className="text-xs text-muted-foreground">
                              Primary file: {firstFile.fileName} • {formatFileSize(firstFile.sizeBytes)}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">No file is attached yet.</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedTemplateId(template.templateId)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View details
                        </Button>
                        {firstFile?.url ? (
                          <Button asChild variant="outline" size="sm">
                            <a href={firstFile.url} target="_blank" rel="noreferrer">
                              <Eye className="h-4 w-4 mr-2" />
                              Open
                            </a>
                          </Button>
                        ) : null}
                        {firstFile?.url ? (
                          <Button asChild variant="outline" size="sm">
                            <a href={firstFile.url} download>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-[calc(100vw-1.25rem)] sm:max-w-[500px] p-0 overflow-hidden gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {selectedDoc ? `Feedback for ${selectedDoc.name}` : "Submission feedback"}
            </DialogTitle>
            <DialogDescription>
              Review advisor feedback and metadata for the selected student submission.
            </DialogDescription>
          </DialogHeader>

          {/* ── Gradient header ─────────────────────────────────── */}
          <div className="relative h-16 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 shrink-0">
            {/* doc icon centered-bottom overlap */}
            <div className="absolute -bottom-5 left-4">
              <div className="h-10 w-10 rounded-xl bg-primary/15 border-2 border-background flex items-center justify-center shadow-sm">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>

          {/* ── Identity row ─────────────────────────────────────── */}
          <div className="pt-7 px-3.5 pb-2 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold break-words" title={selectedDoc?.name}>
                {selectedDoc?.name}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {selectedDoc?.milestone} · {selectedDoc && new Date(selectedDoc.uploadedAt).toLocaleDateString()}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">{selectedDoc?.source === "proposal" ? "Proposal" : "Milestone"}</Badge>
                {selectedDoc?.submittedBy ? <Badge variant="secondary">By {selectedDoc.submittedBy}</Badge> : null}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              {selectedDoc && statusBadge(selectedDoc.status)}
            </div>
          </div>

          <div className="mx-3.5 border-t" />

          <div className="px-3.5 pt-3 pb-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/20 px-2.5 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Submitted</p>
                <p className="mt-1 text-xs text-foreground">{selectedDoc ? formatDate(selectedDoc.uploadedAt) : "-"}</p>
                {selectedDoc?.size ? <p className="mt-1 text-[11px] text-muted-foreground">{selectedDoc.size}</p> : null}
              </div>
              <div className="rounded-lg border bg-muted/20 px-2.5 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Reviewed By</p>
                <p className="mt-1 text-xs text-foreground">{selectedDoc?.reviewedBy || "Not reviewed yet"}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {selectedDoc?.reviewedAt ? `Updated ${formatDate(selectedDoc.reviewedAt)}` : "Awaiting review update"}
                </p>
              </div>
            </div>
            {selectedDoc?.details ? (
              <div className="mt-2 rounded-lg border bg-muted/20 px-2.5 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Details</p>
                <p className="mt-1 text-xs text-foreground">{selectedDoc.details}</p>
              </div>
            ) : null}
            {selectedDoc?.url ? (
              <div className="mt-2 flex justify-end">
                <Button asChild variant="outline" size="sm">
                  <a href={selectedDoc.url} download>
                    <Download className="h-4 w-4 mr-2" />
                    Download Submission
                  </a>
                </Button>
              </div>
            ) : null}
          </div>

          <div className="mx-3.5 border-t" />

          {/* ── Comments ─────────────────────────────────────────── */}
          <div className="px-3.5 pt-3 pb-1">
            <div className="flex items-center gap-1.5 mb-2">
              <MessageCircle className="h-3 w-3 text-primary" />
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Advisor Feedback
              </p>
              {selectedDoc && selectedDoc.comments.length > 0 && (
                <Badge variant="secondary" className="text-[10px] h-4 ml-auto">
                  {selectedDoc.comments.length}
                </Badge>
              )}
            </div>

            <ScrollArea className="h-[170px] pr-1">
              <div className="space-y-2">
                {!selectedDoc || selectedDoc.comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mb-2">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">No feedback yet for this document.</p>
                  </div>
                ) : (
                  selectedDoc.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-lg border bg-muted/20 px-2.5 py-2"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold text-primary">
                              {initialLetters(comment.author)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">{comment.author}</p>
                            {comment.authorRole ? (
                              <p className="text-[10px] text-muted-foreground truncate">{comment.authorRole}</p>
                            ) : null}
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">{comment.date}</span>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed">{comment.text}</p>
                      {comment.attachmentUrl && comment.attachmentName ? (
                        <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Button asChild variant="outline" size="sm" className="h-7 text-[11px]">
                              <a href={comment.attachmentUrl} target="_blank" rel="noreferrer">
                                <Eye className="h-3.5 w-3.5 mr-1.5" />
                                Attachment
                              </a>
                            </Button>
                            <Button asChild variant="outline" size="icon" className="h-7 w-7">
                              <a href={comment.attachmentUrl} download>
                                <Download className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground break-all">
                            {comment.attachmentName}
                            {comment.attachmentSize && comment.attachmentSize !== "-" ? ` • ${comment.attachmentSize}` : ""}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="mx-3.5 border-t" />

          <div className="px-3.5 pt-3 pb-3.5 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setSelectedDoc(null)}
            >
              Close
            </Button>
          </div>

        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedTemplateId} onOpenChange={(open) => !open && setSelectedTemplateId(null)}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Template Details
            </DialogTitle>
            <DialogDescription>
              Review the selected department template and open or download any attached file.
            </DialogDescription>
          </DialogHeader>

          {templateDetailQuery.isLoading ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Loading template details...
            </div>
          ) : templateDetailQuery.isError ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-destructive">
              {templateDetailQuery.error.message}
            </div>
          ) : templateDetailQuery.data ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold">{templateDetailQuery.data.title}</h3>
                  <Badge variant="outline">{templateDetailQuery.data.type}</Badge>
                  <Badge variant={templateDetailQuery.data.isActive ? "secondary" : "outline"}>
                    {templateDetailQuery.data.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {templateDetailQuery.data.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">{templateDetailQuery.data.description}</p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">No description was provided for this template.</p>
                )}

                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>Created {formatDate(templateDetailQuery.data.createdAt)}</span>
                  <span>Updated {formatDate(templateDetailQuery.data.updatedAt)}</span>
                  <span>{templateDetailQuery.data.files.length} attached file{templateDetailQuery.data.files.length === 1 ? "" : "s"}</span>
                </div>
              </div>

              <div className="space-y-3">
                {templateDetailQuery.data.files.length ? (
                  templateDetailQuery.data.files.map((file) => (
                    <div key={file.fileId} className="rounded-lg border p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0 space-y-1">
                        <p className="font-medium break-all">{file.fileName}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>{formatFileSize(file.sizeBytes)}</span>
                          <span>{file.mimeType}</span>
                          <span>Added {formatDate(file.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <a href={file.url} target="_blank" rel="noreferrer">
                            <Eye className="h-4 w-4 mr-2" />
                            Open
                          </a>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <a href={file.url} download>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    No files are attached to this template yet.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}