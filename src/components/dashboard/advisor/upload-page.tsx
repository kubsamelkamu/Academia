"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Upload } from "lucide-react"

export function AdvisorUploadPage() {
  const [fileName, setFileName] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)
  const [project, setProject] = React.useState("")
  const [notes, setNotes] = React.useState("")

  function submit() {
    if (!file || !project.trim()) {
      toast.error("Missing information", { description: "Please select a file and provide a project." })
      return
    }

    toast.success("Uploaded", { description: `${file.name} → ${project}` })
    setFileName("")
    setFile(null)
    setProject("")
    setNotes("")
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Upload Document</h1>
          <p className="text-sm text-muted-foreground">Attach a document to a project for review.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/advisor/documents">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Select file *</Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                id="file"
                type="file"
                className="sm:w-auto"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null
                  setFile(f)
                  setFileName(f?.name ?? "")
                }}
              />
              {fileName && (
                <span className="text-xs text-muted-foreground truncate sm:max-w-[200px]">
                  Selected: <span className="font-medium text-foreground">{fileName}</span>
                </span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Input id="project" value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g. AI‑Driven Academic Assistant" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} placeholder="Add context for reviewers..." />
          </div>
          <div className="flex justify-end">
            <Button className="btn-gradient" onClick={submit}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvisorUploadPage

