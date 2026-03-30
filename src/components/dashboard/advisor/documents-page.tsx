"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  useAdvisorDocuments,
  useApproveDocumentMutation,
  useRequestDocumentRevisionMutation,
} from "@/lib/hooks/useAdvisor"
import { CheckCircle, Download, Eye, FileText, Loader2, Search, Upload } from "lucide-react"

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function AdvisorDocumentsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterType, setFilterType] = React.useState("all")
  const [filterStatus, setFilterStatus] = React.useState("all")

  const documentsQuery = useAdvisorDocuments({
    type: filterType === "all" ? undefined : filterType,
    status: filterStatus === "all" ? undefined : filterStatus,
  })
  const approveDocumentMutation = useApproveDocumentMutation()
  const requestDocumentRevisionMutation = useRequestDocumentRevisionMutation()

  const documents = React.useMemo(() => {
    const items = documentsQuery.data?.items ?? []
    const term = searchTerm.trim().toLowerCase()
    if (!term) return items
    return items.filter((document) =>
      [document.name, document.project, document.group].some((value) => value.toLowerCase().includes(term)),
    )
  }, [documentsQuery.data?.items, searchTerm])

  async function handleApprove(documentId: string) {
    try {
      await approveDocumentMutation.mutateAsync({ documentId })
      toast.success("Document approved.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve document")
    }
  }

  async function handleRevision(documentId: string, name: string) {
    const feedback = window.prompt(`Revision feedback for ${name}`, "")
    if (feedback === null) return
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

<<<<<<< HEAD
  const stats = documentsQuery.data?.stats ?? {
    totalDocuments: 0,
    approvedCount: 0,
    pendingReviewCount: 0,
    revisionRequiredCount: 0,
=======
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
>>>>>>> 07a2570ae68450a4a6f54472eb0a28472d2b7faa
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Document Repository</h1>
          <p className="text-sm text-muted-foreground">Review, approve, and request revisions for project documents.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/advisor">Back</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/advisor/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{stats.totalDocuments}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Approved</p><p className="text-2xl font-bold">{stats.approvedCount}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Pending review</p><p className="text-2xl font-bold">{stats.pendingReviewCount}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Revision required</p><p className="text-2xl font-bold">{stats.revisionRequiredCount}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search documents..." className="pl-9" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="docx">DOCX</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="zip">ZIP</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending_review">Pending review</SelectItem>
                <SelectItem value="revision_required">Revision required</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documentsQuery.isLoading ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Loading documents...</TableCell></TableRow>
              ) : documents.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No documents found.</TableCell></TableRow>
              ) : (
                documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{document.name}</p>
                        <p className="text-sm text-muted-foreground">{document.description || document.type}</p>
                      </div>
<<<<<<< HEAD
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{document.project}</p>
                        <p className="text-sm text-muted-foreground">{document.group}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{document.status}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(document.uploadedAt)}</TableCell>
                    <TableCell>{document.size}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/advisor/documents/${document.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/advisor/documents/${document.id}`)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        {document.status === "pending_review" ? (
                          <>
                            <Button variant="outline" size="sm" onClick={() => void handleApprove(document.id)} disabled={approveDocumentMutation.isPending}>
                              {approveDocumentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => void handleRevision(document.id, document.name)} disabled={requestDocumentRevisionMutation.isPending}>
                              <FileText className="h-4 w-4" />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
=======
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
                            onClick={() => handleApprove()}
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
>>>>>>> 07a2570ae68450a4a6f54472eb0a28472d2b7faa
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvisorDocumentsPage