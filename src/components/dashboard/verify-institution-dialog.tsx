"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface VerifyInstitutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VerifyInstitutionDialog({ open, onOpenChange }: VerifyInstitutionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify Institution</DialogTitle>
          <DialogDescription>
            Please verify your institution details to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Institution verification is required to use dashboard features.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
