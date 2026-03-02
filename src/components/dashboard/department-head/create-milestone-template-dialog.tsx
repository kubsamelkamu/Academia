"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { useAuthStore } from "@/store/auth-store"
import { useCreateMilestoneTemplate } from "@/lib/hooks/use-milestone-templates"
import { useMilestoneTemplateForm } from "@/lib/hooks/use-milestone-template-form"

import { MilestoneTemplateFormBody } from "@/components/dashboard/department-head/milestone-template-form-body"

export function CreateMilestoneTemplateDialog({
  onCreated,
}: {
  onCreated?: () => void
}) {
  const [open, setOpen] = useState(false)
  const form = useMilestoneTemplateForm()

  const departmentId = useAuthStore((s) => s.user?.departmentId)
  const createMutation = useCreateMilestoneTemplate(departmentId)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          form.resetToEmpty()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto top-4 translate-y-0 sm:top-[50%] sm:translate-y-[-50%]">
        <DialogHeader>
          <DialogTitle>Create milestone template</DialogTitle>
          <DialogDescription>
            Define a reusable schedule with ordered milestones.
          </DialogDescription>
        </DialogHeader>

        <MilestoneTemplateFormBody
          dto={form.dto}
          localError={form.localError}
          setLocalError={form.setLocalError}
          milestones={form.milestones}
          setName={form.setName}
          setDescription={form.setDescription}
          name={form.name}
          description={form.description}
          isActive={form.isActive}
          setIsActive={form.setIsActive}
          addMilestone={form.addMilestone}
          removeMilestone={form.removeMilestone}
          setMilestone={form.setMilestone}
          requiredDocsTextBySeq={form.requiredDocsTextBySeq}
          setRequiredDocsTextBySeq={form.setRequiredDocsTextBySeq}
          validate={form.validate}
          isPending={createMutation.isPending}
          submitLabel="Create"
          pendingLabel="Creating"
          onSubmit={async () => {
            form.setLocalError(null)
            const err = form.validate()
            if (err) {
              form.setLocalError(err)
              return
            }
            try {
              await createMutation.mutateAsync(form.dto)
              toast.success("Milestone template created.")
              setOpen(false)
              onCreated?.()
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : "Failed to create milestone template"
              )
            }
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
