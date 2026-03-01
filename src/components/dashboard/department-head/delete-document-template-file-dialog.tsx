"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Trash2 } from "lucide-react"

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

import { useAuthStore } from "@/store/auth-store"
import { useDeleteDocumentTemplateFile } from "@/lib/hooks/use-document-templates"

export function DeleteDocumentTemplateFileDialog({
  templateId,
  fileId,
  fileName,
  onDeleted,
}: {
  templateId: string
  fileId: string
  fileName: string
  onDeleted?: () => void
}) {
  const departmentId = useAuthStore((s) => s.user?.departmentId)
  const deleteMutation = useDeleteDocumentTemplateFile(departmentId)
  const [open, setOpen] = useState(false)

  const confirm = async () => {
    try {
      await deleteMutation.mutateAsync({ templateId, fileId })
      toast.success("File deleted.")
      setOpen(false)
      onDeleted?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete file")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete file</DialogTitle>
          <DialogDescription>
            This will permanently delete “{fileName}”. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter showCloseButton>
          <Button type="button" variant="destructive" onClick={confirm} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting
              </span>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
