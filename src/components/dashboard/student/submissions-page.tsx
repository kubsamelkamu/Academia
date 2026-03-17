"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  Trash2,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import { useDocumentTemplate, useDocumentTemplatesList } from "@/lib/hooks/use-document-templates"
import { useAuthStore } from "@/store/auth-store"
import type { DocumentTemplateType } from "@/types/document-templates"

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
}

const submissions: StudentSubmission[] = [
  {
    id: "1",
    name: "Project Proposal v2.pdf",
    size: "2.4 MB",
    uploadedAt: "2024-07-15",
    milestone: "Proposal",
    status: "reviewed",
    comments: [
      {
        id: "c1",
        author: "Dr. Smith",
        text: "Good proposal, but add more detail in methodology.",
        date: "2024-07-16",
        resolved: false,
      },
      {
        id: "c2",
        author: "Dr. Smith",
        text: "Timeline section needs revision.",
        date: "2024-07-16",
        resolved: true,
      },
    ],
  },
  {
    id: "2",
    name: "Requirements Specification.pdf",
    size: "1.8 MB",
    uploadedAt: "2024-07-20",
    milestone: "Requirements",
    status: "pending",
    comments: [],
  },
  {
    id: "3",
    name: "System Architecture Design.pdf",
    size: "3.2 MB",
    uploadedAt: "2024-07-22",
    milestone: "Design",
    status: "reviewed",
    comments: [
      {
        id: "c3",
        author: "Dr. Smith",
        text: "Consider adding more details about data flow.",
        date: "2024-07-23",
        resolved: false,
      },
    ],
  },
  {
    id: "4",
    name: "Implementation Report.pdf",
    size: "4.9 MB",
    uploadedAt: "2024-07-25",
    milestone: "Implementation",
    status: "approved",
    comments: [],
  },
]

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

export function StudentSubmissionsPage() {
  const router = useRouter()
  const departmentId = useAuthStore((s) => s.user?.departmentId)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [templateSearch, setTemplateSearch] = useState("")
  const [templateTypeFilter, setTemplateTypeFilter] = useState<DocumentTemplateType | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<StudentSubmission | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [reply, setReply] = useState("")
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
  }, [searchTerm, statusFilter])

  const stats = useMemo(
    () => ({
      total: submissions.length,
      withFeedback: submissions.filter((d) => d.comments.length > 0).length,
      pending: submissions.filter((d) => d.status === "pending").length,
      approved: submissions.filter((d) => d.status === "approved").length,
    }),
    []
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
                      <Button variant="outline" size="icon" onClick={() => toast.info("Preview coming soon")}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => toast.success("Download started")}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => toast.error("Delete action is disabled in demo")}>
                        <Trash2 className="h-4 w-4 text-red-600" />
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
        <DialogContent className="sm:max-w-[680px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Advisor Feedback
            </DialogTitle>
            <DialogDescription>{selectedDoc?.name}</DialogDescription>
          </DialogHeader>

          {selectedDoc && (
            <div className="space-y-4">
              <ScrollArea className="h-[260px] pr-2">
                <div className="space-y-3">
                  {selectedDoc.comments.length === 0 ? (
                    <div className="text-sm text-muted-foreground rounded-lg border p-4">
                      No feedback yet for this document.
                    </div>
                  ) : (
                    selectedDoc.comments.map((comment) => (
                      <div key={comment.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">{comment.author}</p>
                          <Badge variant={comment.resolved ? "secondary" : "outline"}>
                            {comment.resolved ? "Resolved" : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-sm">{comment.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">{comment.date}</p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="space-y-2">
                <Textarea
                  placeholder="Reply to advisor..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      if (!reply.trim()) return
                      toast.success("Reply sent to advisor")
                      setReply("")
                    }}
                  >
                    Send Reply
                  </Button>
                </div>
              </div>
            </div>
          )}
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