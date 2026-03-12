"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, FileText, Upload } from "lucide-react"

type DocumentStatus = "submitted" | "approved" | "revision"

interface DocumentRow {
  id: string
  name: string
  project: string
  uploadedBy: string
  uploadedAt: string
  status: DocumentStatus
}

const mockDocuments: DocumentRow[] = [
  {
    id: "d1",
    name: "Prototype Report.pdf",
    project: "AI‑Driven Academic Assistant",
    uploadedBy: "Team AI Research Group",
    uploadedAt: "2024-07-08",
    status: "submitted",
  },
  {
    id: "d2",
    name: "Architecture v2.pdf",
    project: "Real‑Time Campus Analytics",
    uploadedBy: "Team Atlas",
    uploadedAt: "2024-06-24",
    status: "approved",
  },
]

function statusBadge(status: DocumentStatus) {
  if (status === "approved") return <Badge className="bg-success/10 text-success border-success/20">Approved</Badge>
  if (status === "submitted") return <Badge className="bg-warning/10 text-warning border-warning/20">Submitted</Badge>
  return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Revision</Badge>
}

export function AdvisorDocumentsPage() {
  const [query, setQuery] = React.useState("")

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return mockDocuments
    return mockDocuments.filter((d) => d.name.toLowerCase().includes(q) || d.project.toLowerCase().includes(q))
  }, [query])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground">Browse submissions and download project documents.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/advisor">
              Back
            </Link>
          </Button>
          <Button asChild className="btn-gradient">
            <Link href="/dashboard/advisor/upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documents or projects..." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{doc.project}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{doc.uploadedAt}</TableCell>
                  <TableCell>{statusBadge(doc.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast.message("Download started", { description: doc.name })}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-10">
                    No documents found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvisorDocumentsPage

