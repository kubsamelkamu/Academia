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
import type { AdvisorDocumentRow } from "@/lib/types/advisor"
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
    const items: AdvisorDocumentRow[] = documentsQuery.data?.items ?? []
    const term = searchTerm.trim().toLowerCase()
    if (!term) return items
    return items.filter((document: AdvisorDocumentRow) =>
      [document.name, document.project, document.group].some((value: string) =>
        value.toLowerCase().includes(term),
      ),
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

  const stats = documentsQuery.data?.stats ?? {
    totalDocuments: 0,
    approvedCount: 0,
    pendingReviewCount: 0,
    revisionRequiredCount: 0,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Document Repository</h1>
          <p className="text-sm text-muted-foreground">
            Review, approve, and request revisions for project documents.
          </p>
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

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{stats.totalDocuments}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Approved</p><p className="text-2xl font-bold">{stats.approvedCount}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Pending review</p><p className="text-2xl font-bold">{stats.pendingReviewCount}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Revision required</p><p className="text-2xl font-bold">{stats.revisionRequiredCount}</p></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search documents..."
                className="pl-9"
              />
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

      {/* Table */}
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
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Loading documents…
                  </TableCell>
                </TableRow>
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No documents found.
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((document: AdvisorDocumentRow) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <p className="font-medium">{document.name}</p>
                      <p className="text-sm text-muted-foreground">{document.description || document.type}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{document.project}</p>
                      <p className="text-sm text-muted-foreground">{document.group}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{document.status}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(document.uploadedAt)}</TableCell>
                    <TableCell>{document.size}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/advisor/documents/${document.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/advisor/documents/${document.id}`)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {document.status === "pending_review" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void handleApprove(document.id)}
                              disabled={approveDocumentMutation.isPending}
                            >
                              {approveDocumentMutation.isPending
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <CheckCircle className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void handleRevision(document.id, document.name)}
                              disabled={requestDocumentRevisionMutation.isPending}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvisorDocumentsPage
