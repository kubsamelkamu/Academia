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
import { Textarea } from "@/components/ui/textarea"

import { useCreateDocumentTemplate } from "@/lib/hooks/use-document-templates"
import { formatBytesAsMb, validateDocumentTemplateFiles } from "@/lib/file-utils"
import { useAuthStore } from "@/store/auth-store"
import type { DocumentTemplateType } from "@/types/document-templates"

const typeOptions: Array<{ label: string; value: DocumentTemplateType }> = [
  { label: "SRS", value: "SRS" },
  { label: "SDD", value: "SDD" },
  { label: "REPORT", value: "REPORT" },
  { label: "OTHER", value: "OTHER" },
]

export function CreateDocumentTemplateDialog({
  onCreated,
}: {
  onCreated?: () => void
}) {
  const departmentId = useAuthStore((s) => s.user?.departmentId)
  const createMutation = useCreateDocumentTemplate(departmentId)

  const [open, setOpen] = useState(false)
  const [type, setType] = useState<DocumentTemplateType>("SRS")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [files, setFiles] = useState<File[]>([])
  const [localError, setLocalError] = useState<string | null>(null)

  const resetForm = () => {
    setType("SRS")
    setTitle("")
    setDescription("")
    setIsActive(true)
    setFiles([])
    setLocalError(null)
  }

  const input = useMemo(() => {
    return {
      type,
      title: title.trim(),
      description: description.trim().length ? description.trim() : undefined,
      isActive,
      files,
    }
  }, [type, title, description, isActive, files])

  const validate = (): string | null => {
    if (!input.title || input.title.length < 3) {
      return "Title must be at least 3 characters."
    }

    return validateDocumentTemplateFiles(input.files, {
      tooManyFilesError: "You can upload up to 10 files per template.",
    })
  }

  const onPickFiles = (fileList: FileList | null) => {
    if (!fileList) {
      setFiles([])
      return
    }

    // De-dupe by name + size + lastModified to avoid accidental duplicates
    const nextFiles = Array.from(fileList)
    const key = (f: File) => `${f.name}::${f.size}::${f.lastModified}`
    const unique = new Map<string, File>()
    for (const f of nextFiles) {
      unique.set(key(f), f)
    }
    setFiles(Array.from(unique.values()))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <Plus className="h-4 w-4" />
          Upload Template
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create document template</DialogTitle>
          <DialogDescription>
            Upload department document templates (PDF/DOCX). Max 10 files, 10MB each.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex flex-wrap items-center gap-2">
                {typeOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    size="sm"
                    variant={type === opt.value ? "secondary" : "outline"}
                    onClick={() => setType(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={isActive ? "secondary" : "outline"}
                  onClick={() => setIsActive(true)}
                >
                  Active
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={!isActive ? "secondary" : "outline"}
                  onClick={() => setIsActive(false)}
                >
                  Inactive
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="SRS Template" />
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short notes about this template"
            />
          </div>

          <div className="space-y-2">
            <Label>Files</Label>
            <Input
              type="file"
              multiple
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => onPickFiles(e.target.files)}
            />
            {!files.length ? (
              <p className="text-xs text-muted-foreground">No files selected.</p>
            ) : (
              <div className="space-y-1 rounded-md border p-2">
                {files.map((file) => (
                  <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytesAsMb(file.size)}</p>
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
          </div>

          {localError ? <p className="text-sm text-destructive">{localError}</p> : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={async () => {
              setLocalError(null)
              const err = validate()
              if (err) {
                setLocalError(err)
                return
              }

              try {
                await createMutation.mutateAsync(input)
                toast.success("Document template created.")
                setOpen(false)
                onCreated?.()
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to create document template")
              }
            }}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
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
