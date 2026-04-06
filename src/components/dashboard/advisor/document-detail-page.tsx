"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useAdvisorSubmittedDocuments } from "@/lib/hooks/useAdvisor"
import type { AdvisorSubmittedDocumentItem } from "@/lib/types/advisor"
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  CheckCircle,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  Info,
  MessageSquare,
  Paperclip,
  Video as VideoIcon,
} from "lucide-react"

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

  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`
  if (value >= 1024) return `${Math.round(value / 1024)} KB`

  return `${value} B`
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return "Unable to load the requested document."
}

function getUploaderName(document: AdvisorSubmittedDocumentItem) {
  return [document.uploadedBy.firstName, document.uploadedBy.lastName].filter(Boolean).join(" ") || document.uploadedBy.email
}

function getStatusMeta(status?: string | null) {
  const normalized = status?.trim().toUpperCase()

  switch (normalized) {
    case "APPROVED":
      return {
        label: "Approved",
        className: "bg-success/10 text-success border-success/20",
        icon: CheckCircle,
      }
    case "REVISION_REQUIRED":
    case "REVISION_REQUESTED":
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

function getDocumentTypeKey(document: AdvisorSubmittedDocumentItem) {
  const mimeType = document.mimeType?.trim().toLowerCase() ?? ""
  const resourceType = document.resourceType?.trim().toLowerCase() ?? ""
  const lowerName = document.documentName.trim().toLowerCase()

  if (mimeType.includes("pdf") || lowerName.endsWith(".pdf")) return "pdf"
  if (mimeType.includes("wordprocessingml") || mimeType.includes("msword") || lowerName.endsWith(".doc") || lowerName.endsWith(".docx")) return "doc"
  if (mimeType.startsWith("image/") || resourceType === "image") return "image"
  if (mimeType.startsWith("video/") || resourceType === "video") return "video"
  if (mimeType.includes("zip") || mimeType.includes("archive") || lowerName.endsWith(".zip") || lowerName.endsWith(".rar")) return "archive"

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
      return <FileText className="h-6 w-6 text-red-500" />
    case "doc":
      return <FileIcon className="h-6 w-6 text-blue-500" />
    case "image":
      return <ImageIcon className="h-6 w-6 text-green-500" />
    case "video":
      return <VideoIcon className="h-6 w-6 text-primary" />
    case "archive":
      return <Archive className="h-6 w-6 text-amber-500" />
    default:
      return <FileIcon className="h-6 w-6 text-muted-foreground" />
  }
}

function getViewer(document: AdvisorSubmittedDocumentItem) {
  const type = getDocumentTypeKey(document)

  if (type === "pdf") {
    return (
      <div className="overflow-hidden rounded-xl border bg-background">
        <iframe src={document.fileUrl} className="h-[70vh] min-h-[480px] w-full" title={document.documentName} />
      </div>
    )
  }

  if (type === "image") {
    return (
      <div className="overflow-hidden rounded-xl border bg-muted/10 p-4">
        <img src={document.fileUrl} alt={document.documentName} className="max-h-[70vh] w-full rounded-lg object-contain" />
      </div>
    )
  }

  if (type === "video") {
    return (
      <div className="overflow-hidden rounded-xl border bg-background">
        <video controls className="h-[70vh] min-h-[480px] w-full bg-black">
          <source src={document.fileUrl} type={document.mimeType || "video/mp4"} />
          Your browser does not support video playback.
        </video>
      </div>
    )
  }

  return (
    <Alert className="border-dashed bg-muted/30">
      <Info className="h-4 w-4" />
      <AlertTitle>Preview unavailable</AlertTitle>
      <AlertDescription>
        This file type does not support inline preview here. Use the open or download actions to inspect it externally.
      </AlertDescription>
    </Alert>
  )
}

function LoadingState() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-44" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-3">
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[520px] w-full rounded-xl" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface AdvisorDocumentDetailPageProps {
  documentId: string
}

export function AdvisorDocumentDetailPage({ documentId }: AdvisorDocumentDetailPageProps) {
  const router = useRouter()
  const submittedDocumentsQuery = useAdvisorSubmittedDocuments()

  const documents = submittedDocumentsQuery.data?.documents ?? []
  const document = React.useMemo(
    () => documents.find((item) => item.submissionId === documentId) ?? null,
    [documentId, documents],
  )

  const relatedDocuments = React.useMemo(() => {
    if (!document) return []

    return documents
      .filter((item) => item.submissionId !== document.submissionId && item.project.id === document.project.id)
      .slice(0, 5)
  }, [document, documents])

  const handleCopyLink = React.useCallback(async () => {
    if (typeof window === "undefined") return

    const shareUrl = window.location.href

    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Document link copied")
    } catch {
      toast.error("Failed to copy link")
    }
  }, [])

  const handleDownload = React.useCallback(() => {
    if (!document) return

    const anchor = window.document.createElement("a")
    anchor.href = document.fileUrl
    anchor.target = "_blank"
    anchor.rel = "noreferrer"
    anchor.download = document.documentName
    window.document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  }, [document])

  if (submittedDocumentsQuery.isLoading) {
    return <LoadingState />
  }

  if (submittedDocumentsQuery.isError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="outline" asChild>
          <Link href="/dashboard/advisor/documents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Documents
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load document</AlertTitle>
          <AlertDescription>{getErrorMessage(submittedDocumentsQuery.error)}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="outline" asChild>
          <Link href="/dashboard/advisor/documents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Documents
          </Link>
        </Button>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Document not found</AlertTitle>
          <AlertDescription>
            This submission was not found in the current advisor document library. It may have been removed or the link may be outdated.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const statusMeta = getStatusMeta(document.status)
  const StatusIcon = statusMeta.icon

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard/advisor/documents">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Documents
            </Link>
          </Button>
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {getDocumentIcon(document)}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{document.documentName}</h1>
                <Badge variant="outline" className={statusMeta.className}>
                  <StatusIcon className="mr-1 h-3.5 w-3.5" />
                  {statusMeta.label}
                </Badge>
                <Badge variant="outline">{getDocumentTypeLabel(document)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {document.project.title} • {document.group.name} • {document.milestone.title}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleCopyLink}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </Button>
          <Button asChild variant="outline">
            <a href={document.fileUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open File
            </a>
          </Button>
          <Button onClick={handleDownload} className="btn-gradient">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Document Preview</CardTitle>
            <p className="text-sm text-muted-foreground">Uploaded {formatDateTime(document.uploadedAt)}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {getViewer(document)}
            {document.review.latestFeedbackMessage ? (
              <Alert className="border-warning/20 bg-warning/5">
                <MessageSquare className="h-4 w-4 text-warning" />
                <AlertTitle>Latest feedback</AlertTitle>
                <AlertDescription>{document.review.latestFeedbackMessage}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submission Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Uploaded By</p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={document.uploadedBy.avatarUrl ?? ""} alt={getUploaderName(document)} />
                    <AvatarFallback>
                      {getUploaderName(document)
                        .split(" ")
                        .filter(Boolean)
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{getUploaderName(document)}</p>
                    <p className="text-xs text-muted-foreground">{document.uploadedBy.email}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-3">
                <DetailRow label="Project" value={document.project.title} />
                <DetailRow label="Group" value={document.group.name} />
                <DetailRow label="Milestone" value={document.milestone.title} />
                <DetailRow label="Milestone Status" value={document.milestone.status || "Unknown"} />
                <DetailRow label="Submitted" value={formatDateTime(document.milestone.submittedAt || document.uploadedAt)} />
                <DetailRow label="Due Date" value={formatDateTime(document.milestone.dueDate)} />
                <DetailRow label="File Size" value={formatBytes(document.sizeBytes)} />
                <DetailRow label="Mime Type" value={document.mimeType || "Unknown"} />
                <DetailRow label="Submission Status" value={document.submissionStatus || "Unknown"} />
                <DetailRow label="Approved At" value={formatDateTime(document.approvedAt)} />
                <DetailRow label="Feedback Count" value={String(document.review.feedbackCount)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advisor Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start">
                <Link href="/dashboard/advisor/reviews">
                  <Eye className="mr-2 h-4 w-4" />
                  Open Review Queue
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/dashboard/advisor/documents?project=${encodeURIComponent(document.project.id)}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Project Documents
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/dashboard/advisor/reviews/${document.project.id}`}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Review Project Context
                </Link>
              </Button>
              {document.review.latestFeedbackAttachmentUrl ? (
                <Button asChild variant="outline" className="w-full justify-start">
                  <a href={document.review.latestFeedbackAttachmentUrl} target="_blank" rel="noreferrer">
                    <Paperclip className="mr-2 h-4 w-4" />
                    {document.review.latestFeedbackAttachmentFileName || "Open Feedback Attachment"}
                  </a>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Milestone and Review Context</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Milestone Context</h3>
              <div className="rounded-xl border bg-muted/15 p-4 text-sm">
                <p><span className="text-muted-foreground">Title:</span> {document.milestone.title}</p>
                <p className="mt-2"><span className="text-muted-foreground">Description:</span> {document.milestone.description || "No description provided."}</p>
                <p className="mt-2"><span className="text-muted-foreground">Due Date:</span> {formatDateTime(document.milestone.dueDate)}</p>
                <p className="mt-2"><span className="text-muted-foreground">Submitted At:</span> {formatDateTime(document.milestone.submittedAt || document.uploadedAt)}</p>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Latest Feedback</h3>
              <div className="rounded-xl border bg-muted/15 p-4 text-sm">
                <p className="text-muted-foreground">
                  {document.review.latestFeedbackMessage || "No feedback has been recorded yet for this submission."}
                </p>
                <div className="mt-3 rounded-lg bg-background p-3">
                  <p className="font-medium text-foreground">
                    {document.review.latestFeedbackAuthor
                      ? [document.review.latestFeedbackAuthor.firstName, document.review.latestFeedbackAuthor.lastName]
                          .filter(Boolean)
                          .join(" ") || document.review.latestFeedbackAuthor.email
                      : "Reviewer pending"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {document.review.latestFeedbackAuthorRole || "Reviewer"}
                    {document.review.latestFeedbackAt ? ` • ${formatDateTime(document.review.latestFeedbackAt)}` : ""}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Related Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {relatedDocuments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No other submissions are currently listed for this project.</p>
            ) : (
              <ScrollArea className="h-[320px] pr-4">
                <div className="space-y-3">
                  {relatedDocuments.map((item) => {
                    const relatedStatus = getStatusMeta(item.status)
                    const RelatedStatusIcon = relatedStatus.icon

                    return (
                      <Link
                        key={item.submissionId}
                        href={`/dashboard/advisor/documents/${item.submissionId}`}
                        className="block rounded-xl border p-3 transition-colors hover:bg-muted/20"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            {getDocumentIcon(item)}
                          </div>
                          <div className="min-w-0 flex-1 space-y-2">
                            <p className="truncate text-sm font-medium text-foreground">{item.documentName}</p>
                            <p className="text-xs text-muted-foreground">{item.milestone.title}</p>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className={relatedStatus.className}>
                                <RelatedStatusIcon className="mr-1 h-3 w-3" />
                                {relatedStatus.label}
                              </Badge>
                              <Badge variant="outline">{getDocumentTypeLabel(item)}</Badge>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/20 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  )
}

export default AdvisorDocumentDetailPage