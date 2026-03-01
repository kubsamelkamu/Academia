"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Download, Files, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { useDocumentTemplate } from "@/lib/hooks/use-document-templates"
import { useAuthStore } from "@/store/auth-store"
import type { DocumentTemplateFile } from "@/types/document-templates"
import { DeleteDocumentTemplateFileDialog } from "@/components/dashboard/department-head/delete-document-template-file-dialog"

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString()
}

function normalizeFileName(fileName: string, mimeType: string): string {
  const trimmed = fileName.trim()
  if (!trimmed) {
    return mimeType === "application/pdf" ? "download.pdf" : "download.docx"
  }

  // If backend already includes an extension, keep it.
  if (/[.][a-z0-9]+$/i.test(trimmed)) return trimmed

  if (mimeType === "application/pdf") return `${trimmed}.pdf`
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return `${trimmed}.docx`
  }
  return trimmed
}

export function ManageDocumentTemplateFilesDialog({
  templateId,
  templateTitle,
  triggerLabel,
  initialFiles,
}: {
  templateId: string
  templateTitle: string
  triggerLabel?: string
  initialFiles?: DocumentTemplateFile[]
}) {
  const [open, setOpen] = useState(false)
  const departmentId = useAuthStore((s) => s.user?.departmentId)
  const query = useDocumentTemplate(departmentId, templateId, { enabled: open })
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null)

  const files = query.data?.files ?? initialFiles ?? []
  const title = query.data?.title ?? templateTitle

  const downloadFile = async (file: DocumentTemplateFile) => {
    if (!file.url) return

    try {
      setDownloadingFileId(file.fileId)
      const response = await fetch(file.url)
      if (!response.ok) {
        throw new Error(`Download failed (${response.status})`)
      }
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)

      const anchor = document.createElement("a")
      anchor.href = objectUrl
      anchor.download = normalizeFileName(file.fileName, file.mimeType)
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()

      URL.revokeObjectURL(objectUrl)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to download file")
    } finally {
      setDownloadingFileId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <Files className="h-4 w-4" />
          {triggerLabel ?? "Files"}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Files</DialogTitle>
          <DialogDescription>Manage files for “{title}”.</DialogDescription>
        </DialogHeader>

        {query.isLoading ? (
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading files…
          </p>
        ) : query.isError ? (
          <p className="text-sm text-destructive">{query.error.message}</p>
        ) : !files.length ? (
          <p className="text-sm text-muted-foreground">No files uploaded.</p>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.fileId}
                className="flex flex-col justify-between gap-2 rounded-md border p-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{file.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.mimeType} • {(file.sizeBytes / (1024 * 1024)).toFixed(2)} MB • {formatDate(file.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {file.url ? (
                    <Button asChild type="button" size="sm" variant="outline">
                      <a href={file.url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </Button>
                  ) : null}

                  {file.url ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => downloadFile(file)}
                      disabled={downloadingFileId === file.fileId}
                    >
                      {downloadingFileId === file.fileId ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Downloading…
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Download
                        </>
                      )}
                    </Button>
                  ) : null}

                  <DeleteDocumentTemplateFileDialog
                    templateId={templateId}
                    fileId={file.fileId}
                    fileName={file.fileName}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
