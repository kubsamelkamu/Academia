"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import PageHeader from "@/components/shared/PageHeader"
import StatCard from "@/components/shared/StatCard"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  Archive,
  ArrowLeft,
  BookOpen,
  CheckCircle,
  ClipboardCheck,
  Download,
  Eye,
  File as FileIcon,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Layers,
  Search,
  Shield,
  Upload,
  Video as VideoIcon,
} from "lucide-react"

import { RUBRIC_TOTAL_MAX_PERCENT } from "./advisor-evaluator-shared"

type DocumentStatus = "approved" | "pending_review" | "revision_required"

type DocumentType = "pdf" | "docx" | "image" | "video" | "zip"

interface AdvisorDocumentRow {
  id: string
  name: string
  type: DocumentType
  size: string
  uploadedBy: string
  uploadedAt: string
  project: string
  group: string
  status: DocumentStatus
  description: string
}

const mockDocuments: AdvisorDocumentRow[] = [
  {
    id: "1",
    name: "Project Proposal - Smart Campus System.pdf",
    type: "pdf",
    size: "2.5 MB",
    uploadedBy: "John Doe",
    uploadedAt: "2024-01-15T10:30:00Z",
    project: "Smart Campus System",
    group: "Team Alpha",
    status: "approved",
    description: "Initial project proposal with system requirements and architecture overview",
  },
  {
    id: "2",
    name: "UI Wireframes.zip",
    type: "zip",
    size: "15.2 MB",
    uploadedBy: "Jane Smith",
    uploadedAt: "2024-01-14T14:20:00Z",
    project: "Smart Campus System",
    group: "Team Alpha",
    status: "pending_review",
    description: "Complete set of wireframes for the mobile and web interfaces",
  },
  {
    id: "3",
    name: "Database Schema.png",
    type: "image",
    size: "1.8 MB",
    uploadedBy: "Mike Johnson",
    uploadedAt: "2024-01-13T09:15:00Z",
    project: "Smart Campus System",
    group: "Team Alpha",
    status: "approved",
    description: "Entity relationship diagram showing database structure",
  },
  {
    id: "4",
    name: "API Documentation.docx",
    type: "docx",
    size: "890 KB",
    uploadedBy: "Alex Brown",
    uploadedAt: "2024-01-12T16:45:00Z",
    project: "AI Chatbot",
    group: "Team Beta",
    status: "revision_required",
    description: "Comprehensive API documentation with endpoints and examples",
  },
  {
    id: "5",
    name: "Final Presentation.mp4",
    type: "video",
    size: "45.6 MB",
    uploadedBy: "Emma Davis",
    uploadedAt: "2024-01-11T11:30:00Z",
    project: "AI Chatbot",
    group: "Team Beta",
    status: "approved",
    description: "Final project presentation video with demo",
  },
]

function fileIconFor(type: DocumentType) {
  if (type === "pdf") return <FileText className="h-5 w-5 text-red-500" />
  if (type === "docx") return <FileIcon className="h-5 w-5 text-blue-500" />
  if (type === "image") return <ImageIcon className="h-5 w-5 text-green-500" />
  if (type === "video") return <VideoIcon className="h-5 w-5 text-purple-500" />
  if (type === "zip") return <Archive className="h-5 w-5 text-yellow-500" />
  return <FileIcon className="h-5 w-5 text-muted-foreground" />
}

function statusBadge(status: DocumentStatus) {
  switch (status) {
    case "approved":
      return <Badge className="border-success/20 bg-success/10 text-success">Approved</Badge>
    case "pending_review":
      return <Badge className="border-warning/20 bg-warning/10 text-warning">Pending Review</Badge>
    case "revision_required":
      return <Badge className="border-destructive/20 bg-destructive/10 text-destructive">Revision Required</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export type AdvisorDocumentsPageVariant = "advisor" | "evaluator"

export function AdvisorDocumentsPage({ variant = "advisor" }: { variant?: AdvisorDocumentsPageVariant }) {
  const router = useRouter()
  const isEvaluator = variant === "evaluator"
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterType, setFilterType] = React.useState<"all" | DocumentType>("all")
  const [filterStatus, setFilterStatus] = React.useState<"all" | DocumentStatus>("all")

  const filteredDocuments = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return mockDocuments.filter((doc) => {
      const matchesSearch =
        !term ||
        doc.name.toLowerCase().includes(term) ||
        doc.project.toLowerCase().includes(term) ||
        doc.group.toLowerCase().includes(term)

      const matchesType = filterType === "all" || doc.type === filterType
      const matchesStatus = filterStatus === "all" || doc.status === filterStatus

      return matchesSearch && matchesType && matchesStatus
    })
  }, [searchTerm, filterType, filterStatus])

  function handleDownload(doc: AdvisorDocumentRow) {
    toast.message("Download started", { description: doc.name })
  }

  function handleView(doc: AdvisorDocumentRow) {
    router.push(`/dashboard/advisor/documents/${doc.id}`)
  }

  function handleApprove() {
    toast.success("Document approved", {
      description: "Document has been approved and is now available for download.",
    })
  }

  function handleRequestRevision(projectId: string) {
    toast.message("Revision flow opened", {
      description: "Taking you to the revision feedback page.",
    })
    router.push(`/dashboard/advisor/reviews/${projectId}`)
  }

  const approvedCount = mockDocuments.filter((d) => d.status === "approved").length
  const pendingCount = mockDocuments.filter((d) => d.status === "pending_review").length
  const revisionCount = mockDocuments.filter((d) => d.status === "revision_required").length

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
          placeholder={isEvaluator ? "Search name, project, or group…" : "Search documents, projects, or groups..."}
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search documents"
        />
      </div>
      <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[300px]">
        <div>
          <Label htmlFor="doc-filter-type" className="sr-only">
            Type
          </Label>
          <Select value={filterType} onValueChange={(v) => setFilterType(v as "all" | DocumentType)}>
            <SelectTrigger id="doc-filter-type" className="w-full">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="docx">Word</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="zip">Archive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="doc-filter-status" className="sr-only">
            Status
          </Label>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as "all" | DocumentStatus)}>
            <SelectTrigger id="doc-filter-status" className="w-full">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending_review">Pending review</SelectItem>
              <SelectItem value="revision_required">Revision required</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )

  const documentsTable = (
    <Card className={cn(isEvaluator && "overflow-hidden border-border/80 shadow-sm")}>
      <CardHeader
        className={cn(
          isEvaluator && "border-b border-border/50 bg-muted/10",
          !isEvaluator && "pb-3",
        )}
      >
        <CardTitle className="text-lg">
          Documents ({filteredDocuments.length}
          {isEvaluator && (searchTerm.trim() || filterType !== "all" || filterStatus !== "all") ? " filtered" : ""})
        </CardTitle>
        {isEvaluator ? (
          <CardDescription>Preview and download — approve/revise from the advisor documents area.</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className={cn(isEvaluator && "p-0")}>
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
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {fileIconFor(doc.type)}
                      <div className="min-w-0">
                        <p className="font-medium leading-snug">{doc.name}</p>
                        <p className="line-clamp-2 text-sm text-muted-foreground">{doc.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{doc.project}</p>
                      <p className="text-sm text-muted-foreground">{doc.group}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src="" alt={doc.uploadedBy} />
                        <AvatarFallback className="text-xs">
                          {doc.uploadedBy
                            .split(" ")
                            .filter(Boolean)
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{doc.uploadedBy}</span>
                    </div>
                  </TableCell>
                  <TableCell>{statusBadge(doc.status)}</TableCell>
                  <TableCell>{doc.size}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(doc.uploadedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(isEvaluator && "h-9 w-9 rounded-lg")}
                        onClick={() => handleView(doc)}
                        aria-label="View document"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(isEvaluator && "h-9 w-9 rounded-lg")}
                        onClick={() => handleDownload(doc)}
                        aria-label="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {!isEvaluator && doc.status === "pending_review" ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-success hover:text-success"
                            onClick={() => handleApprove()}
                            aria-label="Approve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRequestRevision(doc.project === "Smart Campus System" ? "p1" : "p2")}
                          >
                            Revision
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-14 text-center">
                    <p className="font-medium text-foreground">No documents match</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {isEvaluator ? "Clear search or filters to see the full library." : "Try adjusting filters."}
                    </p>
                    {isEvaluator ? (
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
                    ) : null}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )

  if (isEvaluator) {
    return (
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
              description="Cross-project files for review while you evaluate — same repository as the advisor hub, tuned for read-only evaluator workflow."
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
            value={mockDocuments.length}
            subtitle="Demo repository"
            icon={FileText}
            iconClassName="bg-primary/10 text-primary"
          />
          <StatCard
            title="Approved"
            value={approvedCount}
            subtitle="Ready reference"
            icon={CheckCircle}
            iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            title="Pending review"
            value={pendingCount}
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

        <section
          aria-label="Document review guide"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-12 xl:gap-5"
        >
          <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-primary/[0.07] via-background to-background p-5 shadow-sm sm:col-span-2 xl:col-span-7">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" aria-hidden />
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Layers className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 space-y-2 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Suggested reading order</p>
                <p>
                  Charter or proposal first, then UI artifacts, then deep PDFs. Watch videos once you know what should
                  appear on screen. When you land from a pending card, narrow by <strong className="text-foreground">project</strong>{" "}
                  and status so “approved reference” files are not mixed with in-flight advisor review.
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
                  Treat uploads as student records—no off-channel sharing. Demo downloads only toast; production should log
                  or watermark. If a file is older than the latest milestone, say so in rubric comments instead of assuming
                  it is current.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/20 p-5 sm:col-span-2 xl:col-span-12">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <p className="max-w-3xl text-sm text-muted-foreground">
                <strong className="text-foreground">Status column:</strong> pending review = artifact may still change—note
                timestamps before citing. Revision required = known gaps; avoid scoring the same gap on multiple rubric
                lines.
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
              <CardDescription>Filter by name, type, or review status.</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">{filtersInner}</CardContent>
          </Card>
          {documentsTable}
          <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/15 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Advisor-owned:</span> upload, approve, and revision routing live
              in the advisor shell.
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
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Document Repository</h1>
          <p className="text-sm text-muted-foreground">Review and manage project documents.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/advisor">Back</Link>
          </Button>
          <Button asChild className="btn-gradient">
            <Link href="/dashboard/advisor/upload">
              <Upload className="mr-2 h-4 w-4" aria-hidden />
              Upload Document
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">{filtersInner}</CardContent>
      </Card>

      {documentsTable}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockDocuments.length}</p>
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
                <p className="text-2xl font-bold">{approvedCount}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <Eye className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                <FileIcon className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{revisionCount}</p>
                <p className="text-sm text-muted-foreground">Revision Required</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdvisorDocumentsPage
