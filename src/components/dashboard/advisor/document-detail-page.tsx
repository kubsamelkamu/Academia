"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
<<<<<<< HEAD
=======
import Image from "next/image"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Archive,
  ArrowLeft,
  Clock,
  Download,
  Eye,
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  Loader2,
  User,
  Video as VideoIcon,
} from "lucide-react"
>>>>>>> 07a2570ae68450a4a6f54472eb0a28472d2b7faa
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  useAdvisorDocument,
  useApproveDocumentMutation,
  useRequestDocumentRevisionMutation,
} from "@/lib/hooks/useAdvisor"
import { ArrowLeft, CheckCircle, Download, ExternalLink, Loader2 } from "lucide-react"

function formatDate(value?: string) {
  return value
    ? new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-"
}

function canPreview(mimeType?: string) {
  return Boolean(mimeType && (mimeType.startsWith("image/") || mimeType === "application/pdf" || mimeType.startsWith("video/")))
}

function Preview({ fileUrl, mimeType, title }: { fileUrl: string; mimeType?: string; title: string }) {
  if (mimeType === "application/pdf") {
    return <iframe src={fileUrl} title={title} className="h-[640px] w-full rounded-lg border" />
  }
  if (mimeType?.startsWith("image/")) {
    return <img src={fileUrl} alt={title} className="max-h-[640px] w-full rounded-lg border object-contain" />
  }
  if (mimeType?.startsWith("video/")) {
    return (
      <video controls className="max-h-[640px] w-full rounded-lg border">
        <source src={fileUrl} type={mimeType} />
      </video>
    )
  }
<<<<<<< HEAD
=======

  if (document.type === "image") {
    return (
      <div className="relative border rounded-lg overflow-hidden flex justify-center">
        <Image
          src={`/mock-images/${document.name}`}
          alt={document.name}
          fill
          className="object-contain"
        />
      </div>
    )
  }

  if (document.type === "video") {
    return (
      <div className="border rounded-lg overflow-hidden">
        <video controls className="w-full h-[600px]">
          <source src={`/mock-videos/${document.name}`} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    )
  }

  if (document.type === "docx" || document.type === "zip") {
    return (
      <Alert className="bg-muted/50">
        <FileIcon className="h-4 w-4" />
        <AlertDescription>
          {document.type === "docx" ? "Word documents" : "Archive files"} can only be downloaded and viewed
          externally. Please use the download button to access the file.
        </AlertDescription>
      </Alert>
    )
  }

>>>>>>> 07a2570ae68450a4a6f54472eb0a28472d2b7faa
  return (
    <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
      Preview is not available for this file type. Use the external open or download actions instead.
    </div>
  )
}

interface AdvisorDocumentDetailPageProps {
  documentId: string
}

export function AdvisorDocumentDetailPage({ documentId }: AdvisorDocumentDetailPageProps) {
  const router = useRouter()
  const documentQuery = useAdvisorDocument(documentId)
  const approveDocumentMutation = useApproveDocumentMutation()
  const requestDocumentRevisionMutation = useRequestDocumentRevisionMutation()
  const [feedback, setFeedback] = React.useState("")

  React.useEffect(() => {
    if (documentQuery.data?.feedback) {
      setFeedback(documentQuery.data.feedback)
    }
  }, [documentQuery.data?.feedback])

  async function handleApprove() {
    try {
      await approveDocumentMutation.mutateAsync({
        documentId,
        dto: { feedback: feedback.trim() || undefined },
      })
      toast.success("Document approved.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve document")
    }
  }

  async function handleRevision() {
    if (!feedback.trim()) {
      toast.error("Revision feedback is required.")
      return
    }
    try {
      await requestDocumentRevisionMutation.mutateAsync({
        documentId,
        dto: { feedback: feedback.trim() },
      })
      toast.success("Revision requested.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request revision")
    }
  }

  if (documentQuery.isLoading) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Loading document...</div>
  }

  if (!documentQuery.data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <p className="text-sm text-muted-foreground">Document not found.</p>
        <Button asChild variant="outline"><Link href="/dashboard/advisor/documents">Back to Documents</Link></Button>
      </div>
    )
  }

  const document = documentQuery.data

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{document.name}</h1>
          <p className="text-sm text-muted-foreground">{document.project} - {document.group}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/advisor/documents">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a href={document.fileUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open
            </a>
          </Button>
          <Button asChild>
            <a href={document.fileUrl} target="_blank" rel="noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Download
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <Preview fileUrl={document.fileUrl} mimeType={document.mimeType} title={document.name} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Status: {document.status}</p>
              <p>Uploaded by: {document.uploadedBy}</p>
              <p>Uploaded at: {formatDate(document.uploadedAt)}</p>
              <p>Type: {document.type}</p>
              <p>Size: {document.size}</p>
              {document.reviewedBy ? <p>Reviewed by: {document.reviewedBy}</p> : null}
              {document.reviewedAt ? <p>Reviewed at: {formatDate(document.reviewedAt)}</p> : null}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Feedback</p>
              <Textarea rows={8} value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Write approval notes or revision feedback..." />
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => void handleApprove()} disabled={approveDocumentMutation.isPending}>
                {approveDocumentMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Approve Document
              </Button>
              <Button variant="outline" onClick={() => void handleRevision()} disabled={requestDocumentRevisionMutation.isPending}>
                {requestDocumentRevisionMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Request Revision
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdvisorDocumentDetailPage