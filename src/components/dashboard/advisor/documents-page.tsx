 "use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Archive,
  CheckCircle,
  Download,
  Eye,
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  Search,
  Upload,
  Video as VideoIcon,
} from "lucide-react"

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
      return <Badge className="bg-success/10 text-success border-success/20">Approved</Badge>
    case "pending_review":
      return <Badge className="bg-warning/10 text-warning border-warning/20">Pending Review</Badge>
    case "revision_required":
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Revision Required</Badge>
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

export function AdvisorDocumentsPage() {
  const router = useRouter()
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

  function handleApprove(_id: string) {
    toast.success("Document approved", {
      description: "Document has been approved and is now available for download.",
    })
  }

  function handleRequestRevision(_id: string, projectId: string) {
    toast.message("Revision flow opened", {
      description: "Taking you to the revision feedback page.",
    })
    router.push(`/dashboard/advisor/reviews/${projectId}`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents, projects, or groups..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as "all" | DocumentType)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="docx">Word Document</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="zip">Archive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as "all" | DocumentStatus)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="revision_required">Revision Required</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Documents ({filteredDocuments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Uploaded By</TableHead>
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
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">{doc.description}</p>
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
                      <Button variant="outline" size="sm" onClick={() => handleView(doc)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      {doc.status === "pending_review" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-success hover:text-success"
                            onClick={() => handleApprove(doc.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRequestRevision(doc.id, doc.project === "Smart Campus System" ? "p1" : "p2")}
                          >
                            Revision
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredDocuments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">
                    No documents found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
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
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mockDocuments.filter((d) => d.status === "approved").length}
                </p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <Eye className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mockDocuments.filter((d) => d.status === "pending_review").length}
                </p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                <FileIcon className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mockDocuments.filter((d) => d.status === "revision_required").length}
                </p>
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

