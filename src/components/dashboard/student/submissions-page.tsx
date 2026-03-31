"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
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
import { Textarea } from "@/components/ui/textarea"
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
import type { ProjectProposal } from "@/types/project-proposals"

type SubmissionStatus = "approved" | "reviewed" | "pending"

interface FeedbackComment {
  id: string
  author: string
  text: string
  date: string
  resolved: boolean
}

interface StudentSubmission {
  id: string
  name: string
  size: string
  uploadedAt: string
  milestone: string
  status: SubmissionStatus
  comments: FeedbackComment[]
  url?: string
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

function proposalToSubmissionStatus(status: unknown): SubmissionStatus {
  const normalized = normalizeStatus(status)
  if (normalized === "APPROVED") return "approved"
  if (normalized === "REJECTED") return "reviewed"
  return "pending"
}

function getProposalPdfDocument(proposal: ProjectProposal): ProjectProposal["documents"][number] | null {
  const docs = proposal.documents ?? []
  const match = docs.find((doc) => String(doc.key ?? "").toLowerCase() === "proposal.pdf")
  return match ?? docs[0] ?? null
}

function toProposalFeedbackComments(proposal: ProjectProposal): FeedbackComment[] {
  const text = typeof proposal.feedback === "string" ? proposal.feedback.trim() : ""
  if (!text) return []

  const advisor = proposal.advisor
  const author =
    `${advisor?.firstName ?? ""} ${advisor?.lastName ?? ""}`.trim() ||
    advisor?.email ||
    "Advisor"

  return [
    {
      id: `feedback:${proposal.id}`,
      author,
      text,
      date: formatDate(proposal.updatedAt ?? proposal.createdAt ?? null),
      resolved: false,
    },
  ]
}

export function StudentSubmissionsPage() {
  const router = useRouter()
  const departmentId = useAuthStore((s) => s.user?.departmentId)
  const accessToken = useAuthStore((s) => s.accessToken)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [templateSearch, setTemplateSearch] = useState("")
  const [templateTypeFilter, setTemplateTypeFilter] = useState<DocumentTemplateType | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<StudentSubmission | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [reply, setReply] = useState("")

  const myGroupProposalsQuery = useMyGroupProposals(Boolean(accessToken))

  const submissions = useMemo<StudentSubmission[]>(() => {
    const items = myGroupProposalsQuery.data ?? []

    return items
      .slice()
      .sort((a, b) => {
        const aTime = Date.parse(String(a.updatedAt ?? a.submittedAt ?? a.createdAt ?? ""))
        const bTime = Date.parse(String(b.updatedAt ?? b.submittedAt ?? b.createdAt ?? ""))
        return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0)
      })
      .map((proposal) => {
        const doc = getProposalPdfDocument(proposal)
        const uploadedAt = doc?.uploadedAt ?? proposal.updatedAt ?? proposal.createdAt ?? new Date().toISOString()
        const fileName = doc?.originalName?.trim() || proposal.title?.trim() || "Project Proposal"

        return {
          id: proposal.id,
          name: fileName,
          size: formatFileSize(doc?.sizeBytes ?? null),
          uploadedAt,
          milestone: "Proposal",
          status: proposalToSubmissionStatus(proposal.status),
          comments: toProposalFeedbackComments(proposal),
          url: doc?.url,
        }
      })
  }, [myGroupProposalsQuery.data])
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Submissions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload, manage, and track feedback for your project documents.
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => router.push("/dashboard/student/upload-documents")}
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Documents</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>With Feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.withFeedback}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList className="grid w-full max-w-[420px] grid-cols-2">
          <TabsTrigger value="documents">My Documents</TabsTrigger>
          <TabsTrigger value="templates">Templates & Guidelines</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>All Documents</span>
                <span className="text-sm text-muted-foreground font-normal">{filtered.length} items</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filtered.map((doc) => {
                const unresolved = doc.comments.filter((c) => !c.resolved).length
                return (
                  <div
                    key={doc.id}
                    className="rounded-lg border bg-muted/30 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{doc.name}</p>
                          {statusBadge(doc.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {doc.size} • {doc.milestone} • {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedDoc(doc)}>
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Feedback{unresolved > 0 ? ` (${unresolved})` : ""}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
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
          <Card>
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
        <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden gap-0">

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
          <div className="pt-7 px-4 pb-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" title={selectedDoc?.name}>
                {selectedDoc?.name}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {selectedDoc?.milestone} · {selectedDoc && new Date(selectedDoc.uploadedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              {selectedDoc && statusBadge(selectedDoc.status)}
            </div>
          </div>

          <div className="mx-4 border-t" />

          {/* ── Comments ─────────────────────────────────────────── */}
          <div className="px-4 pt-3 pb-1">
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

            <ScrollArea className="h-[180px] pr-1">
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
                      className="rounded-lg border bg-muted/20 px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold text-primary">
                              {comment.author.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs font-semibold truncate">{comment.author}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-muted-foreground">{comment.date}</span>
                          <Badge
                            variant={comment.resolved ? "secondary" : "outline"}
                            className={`text-[10px] h-4 ${comment.resolved ? "" : "border-amber-200 text-amber-700 bg-amber-500/10"}`}
                          >
                            {comment.resolved ? "Resolved" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed">{comment.text}</p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="mx-4 border-t" />

          {/* ── Reply ────────────────────────────────────────────── */}
          <div className="px-4 pt-3 pb-4 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Your Reply</p>
            <Textarea
              placeholder="Write a reply to your advisor…"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setSelectedDoc(null)}
              >
                Close
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => {
                  if (!reply.trim()) return
                  toast.success("Reply sent to advisor")
                  setReply("")
                }}
              >
                <MessageCircle className="h-3.5 w-3.5" /> Send Reply
              </Button>
            </div>
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