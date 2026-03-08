"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Download, Eye, FileText, Upload } from "lucide-react"
import { toast } from "sonner"

import { useDocumentTemplatesList } from "@/lib/hooks/use-document-templates"
import { useAuthStore } from "@/store/auth-store"
import type { DepartmentDocumentTemplate, DocumentTemplateType } from "@/types/document-templates"

function getRecommendedTemplateType(milestone: string): DocumentTemplateType | null {
  if (milestone === "requirements") return "SRS"
  if (milestone === "design") return "SDD"
  if (milestone === "final") return "REPORT"
  return null
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

export function StudentUploadDocumentsPage() {
  const router = useRouter()
  const departmentId = useAuthStore((s) => s.user?.departmentId)
  const [title, setTitle] = useState("")
  const [milestone, setMilestone] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const recommendedType = getRecommendedTemplateType(milestone)
  const templatesQuery = useDocumentTemplatesList(departmentId, {
    page: 1,
    limit: 10,
    isActive: true,
    type: recommendedType ?? undefined,
  })

  const recommendedTemplate = useMemo<DepartmentDocumentTemplate | null>(() => {
    if (!recommendedType || !templatesQuery.data?.templates.length) {
      return null
    }

    return templatesQuery.data.templates[0] ?? null
  }, [recommendedType, templatesQuery.data?.templates])

  const handleSubmit = async () => {
    if (!title.trim() || !milestone) {
      toast.error("Document title and milestone are required")
      return
    }

    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 900))
    setIsSubmitting(false)
    toast.success("Document uploaded successfully")
    router.push("/dashboard/student/submissions")
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Document</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add a new file to your submissions for advisor review.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard/student/submissions")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Submissions
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
          <CardDescription>Fill in the required fields and upload your file.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-title">Document Title</Label>
            <Input
              id="document-title"
              placeholder="e.g., Project Proposal v3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="document-file">File</Label>
            <Input id="document-file" type="file" accept=".pdf,.doc,.docx,.zip" />
            <p className="text-xs text-muted-foreground">
              Accepted formats: PDF, DOC, DOCX, ZIP (max 50MB)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Milestone</Label>
            <select
              value={milestone}
              onChange={(e) => setMilestone(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select milestone</option>
              <option value="proposal">Proposal</option>
              <option value="requirements">Requirements (SRS)</option>
              <option value="design">Design (SDD)</option>
              <option value="implementation">Implementation</option>
              <option value="final">Final Report</option>
            </select>
          </div>

          {recommendedType ? (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Recommended Template</p>
                    <Badge variant="outline">{recommendedType}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use the department template below as a starting point for this milestone.
                  </p>
                </div>
              </div>

              {!departmentId ? (
                <p className="text-sm text-muted-foreground">
                  Your account is not linked to a department yet, so no template can be suggested.
                </p>
              ) : templatesQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading recommended template...</p>
              ) : templatesQuery.isError ? (
                <p className="text-sm text-destructive">{templatesQuery.error.message}</p>
              ) : recommendedTemplate ? (
                <div className="rounded-lg border bg-background p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium">{recommendedTemplate.title}</p>
                      {recommendedTemplate.description ? (
                        <p className="text-sm text-muted-foreground">{recommendedTemplate.description}</p>
                      ) : null}
                      {recommendedTemplate.files[0] ? (
                        <p className="text-xs text-muted-foreground">
                          {recommendedTemplate.files[0].fileName} • {formatFileSize(recommendedTemplate.files[0].sizeBytes)}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">No file is attached to this template yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {recommendedTemplate.files[0]?.url ? (
                      <Button asChild variant="outline" size="sm">
                        <a href={recommendedTemplate.files[0].url} target="_blank" rel="noreferrer">
                          <Eye className="h-4 w-4 mr-2" />
                          Open
                        </a>
                      </Button>
                    ) : null}
                    {recommendedTemplate.files[0]?.url ? (
                      <Button asChild variant="outline" size="sm">
                        <a href={recommendedTemplate.files[0].url} download>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No active {recommendedType} template is available for your department right now.
                </p>
              )}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a short note for your advisor"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Upload className="h-4 w-4 mr-2" />
              {isSubmitting ? "Uploading..." : "Upload Document"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
