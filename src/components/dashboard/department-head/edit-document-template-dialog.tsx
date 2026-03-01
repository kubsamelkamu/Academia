"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Edit3, Loader2, Save } from "lucide-react"

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
import { useUpdateDocumentTemplate } from "@/lib/hooks/use-document-templates"
import type { DepartmentDocumentTemplate, DocumentTemplateType, UpdateDocumentTemplateDto } from "@/types/document-templates"

const typeOptions: Array<{ label: string; value: DocumentTemplateType }> = [
  { label: "SRS", value: "SRS" },
  { label: "SDD", value: "SDD" },
  { label: "REPORT", value: "REPORT" },
  { label: "OTHER", value: "OTHER" },
]

export function EditDocumentTemplateDialog({
  template,
  onUpdated,
}: {
  template: DepartmentDocumentTemplate
  onUpdated?: () => void
}) {
  const departmentId = useAuthStore((s) => s.user?.departmentId)
  const updateMutation = useUpdateDocumentTemplate(departmentId)

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(template.title)
  const [type, setType] = useState<DocumentTemplateType>(template.type)
  const [isActive, setIsActive] = useState(Boolean(template.isActive))
  const [localError, setLocalError] = useState<string | null>(null)

  const hydrateFromTemplate = () => {
    setTitle(template.title)
    setType(template.type)
    setIsActive(Boolean(template.isActive))
    setLocalError(null)
  }

  const dto: UpdateDocumentTemplateDto = useMemo(() => {
    return {
      title: title.trim(),
      type,
      isActive,
    }
  }, [title, type, isActive])

  const validate = (): string | null => {
    if (!dto.title || dto.title.trim().length < 3) {
      return "Title must be at least 3 characters."
    }
    return null
  }

  const submit = async () => {
    setLocalError(null)

    const err = validate()
    if (err) {
      setLocalError(err)
      return
    }

    try {
      await updateMutation.mutateAsync({ templateId: template.templateId, dto })
      toast.success("Document template updated.")
      setOpen(false)
      onUpdated?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update document template")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          hydrateFromTemplate()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <Edit3 className="h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit document template</DialogTitle>
          <DialogDescription>Update title, type, and active status.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="SRS Template" />
          </div>

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

          {localError ? <p className="text-sm text-destructive">{localError}</p> : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={updateMutation.isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
