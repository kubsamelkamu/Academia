"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Loader2, Plus, Upload, X } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useAuthStore } from "@/store/auth-store"
import { useAddDocumentTemplateFiles } from "@/lib/hooks/use-document-templates"

const allowedMimeTypes = new Set<string>([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])

function isAllowedFile(file: File): boolean {
  if (allowedMimeTypes.has(file.type)) return true
  const name = file.name.toLowerCase()
  return name.endsWith(".pdf") || name.endsWith(".docx")
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—"
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(2)} MB`
}

export function AddDocumentTemplateFilesDialog({
  templateId,
  templateTitle,
  onUploaded,
}: {
  templateId: string
  templateTitle: string
  onUploaded?: () => void
}) {
  const departmentId = useAuthStore((s) => s.user?.departmentId)
  const addFilesMutation = useAddDocumentTemplateFiles(departmentId)

  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [localError, setLocalError] = useState<string | null>(null)

  const resetForm = () => {
    setFiles([])
    setLocalError(null)
  }

  const validate = (): string | null => {
    if (!files.length) {
      return "Please select at least one file (PDF or DOCX)."
    }

    if (files.length > 10) {
      return "You can upload up to 10 files per request."
    }

    for (const file of files) {
      if (!isAllowedFile(file)) {
        return `Unsupported file type: ${file.name}`
      }
      if (file.size > 10 * 1024 * 1024) {
        return `File too large (max 10MB): ${file.name}`
      }
    }

    return null
  }

  const onPickFiles = (fileList: FileList | null) => {
    if (!fileList) {
      setFiles([])
      return
    }

    const nextFiles = Array.from(fileList)
    const key = (f: File) => `${f.name}::${f.size}::${f.lastModified}`
    const unique = new Map<string, File>()
    for (const f of nextFiles) {
      unique.set(key(f), f)
    }
    setFiles(Array.from(unique.values()))
  }

  const payload = useMemo(() => ({ templateId, files }), [templateId, files])

  const submit = async () => {
    setLocalError(null)

    const err = validate()
    if (err) {
      setLocalError(err)
      return
    }

    try {
      await addFilesMutation.mutateAsync(payload)
      toast.success("Files uploaded.")
      setOpen(false)
      onUploaded?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload files")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          resetForm()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <Plus className="h-4 w-4" />
          Add files
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add files</DialogTitle>
          <DialogDescription>
            Upload more files to “{templateTitle}”. PDF/DOCX only. Max 10 files, 10MB each.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Files</Label>
            <Input
              type="file"
              multiple
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => onPickFiles(e.target.files)}
            />
          </div>

          {!files.length ? (
            <p className="text-xs text-muted-foreground">No files selected.</p>
          ) : (
            <div className="space-y-1 rounded-md border p-2">
              {files.map((file) => (
                <div
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setFiles((cur) => cur.filter((f) => f !== file))}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {localError ? <p className="text-sm text-destructive">{localError}</p> : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={addFilesMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={addFilesMutation.isPending}>
            {addFilesMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
