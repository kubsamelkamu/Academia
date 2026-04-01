"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
import { toast } from "sonner"

type DocumentStatus = "approved" | "pending_review" | "revision_required"

type DocumentType = "pdf" | "docx" | "image" | "video" | "zip"

interface AdvisorDocument {
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

const mockDocuments: AdvisorDocument[] = [
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

function fileIcon(type: DocumentType) {
  switch (type) {
    case "pdf":
      return <FileText className="h-6 w-6 text-red-500" />
    case "docx":
      return <FileIcon className="h-6 w-6 text-blue-500" />
    case "image":
      return <ImageIcon className="h-6 w-6 text-green-500" />
    case "video":
      return <VideoIcon className="h-6 w-6 text-purple-500" />
    case "zip":
      return <Archive className="h-6 w-6 text-yellow-500" />
    default:
      return <FileIcon className="h-6 w-6 text-gray-500" />
  }
}

function statusBadge(status: DocumentStatus) {
  switch (status) {
    case "approved":
      return <Badge className="bg-success/10 text-success">Approved</Badge>
    case "pending_review":
      return <Badge className="bg-warning/10 text-warning">Pending Review</Badge>
    case "revision_required":
      return <Badge className="bg-destructive/10 text-destructive">Revision Required</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function renderViewer(document: AdvisorDocument) {
  if (document.type === "pdf") {
    return (
      <div className="border rounded-lg overflow-hidden">
        <iframe
          src={`/mock-pdfs/${document.name}`}
          className="w-full h-[600px]"
          title={document.name}
        />
      </div>
    )
  }

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

  return (
    <Alert variant="destructive">
      <AlertDescription>Unsupported file type. Please download to view.</AlertDescription>
    </Alert>
  )
}

interface AdvisorDocumentDetailPageProps {
  documentId: string
}

export function AdvisorDocumentDetailPage({ documentId }: AdvisorDocumentDetailPageProps) {
  const router = useRouter()
  const [document, setDocument] = React.useState<AdvisorDocument | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const found = mockDocuments.find((d) => d.id === documentId) ?? null
    if (!found) {
      toast.error("Document not found", {
        description: "The requested document could not be found.",
      })
      router.push("/dashboard/advisor/documents")
      return
    }

    setDocument(found)
    setLoading(false)
  }, [documentId, router])

  function handleDownload() {
    if (!document) return
    toast.message("Download started", { description: `Downloading ${document.name}...` })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    )
  }

  if (!document) {
    return null
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/dashboard/advisor/documents")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
          <div className="flex items-center gap-3">
            {fileIcon(document.type)}
            <h1 className="text-2xl font-bold">{document.name}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownload} className="btn-gradient">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Document Viewer */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Document Viewer</CardTitle>
          </CardHeader>
          <CardContent className="p-6">{renderViewer(document)}</CardContent>
        </Card>

        {/* Document Details */}
        <Card>
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Uploaded By</span>
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={document.uploadedBy} />
                  <AvatarFallback className="text-xs">
                    {document.uploadedBy
                      .split(" ")
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{document.uploadedBy}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Uploaded At</span>
              </div>
              <p className="text-sm text-muted-foreground">{formatDate(document.uploadedAt)}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Project</span>
              </div>
              <div>
                <p className="font-medium">{document.project}</p>
                <p className="text-sm text-muted-foreground">{document.group}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status</span>
              </div>
              {statusBadge(document.status)}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">File Info</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Type: {document.type.toUpperCase()} | Size: {document.size}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Description</span>
              </div>
              <p className="text-sm text-muted-foreground">{document.description}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

