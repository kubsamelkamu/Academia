"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Edit3 } from "lucide-react"

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
import { useUpdateMilestoneTemplate } from "@/lib/hooks/use-milestone-templates"
import { useMilestoneTemplateForm } from "@/lib/hooks/use-milestone-template-form"

import { MilestoneTemplateFormBody } from "@/components/dashboard/department-head/milestone-template-form-body"
import type {
  MilestoneTemplate,
  UpdateMilestoneTemplateDto,
} from "@/types/milestone-templates"

export function EditMilestoneTemplateDialog({
  template,
  onUpdated,
}: {
  template: MilestoneTemplate
  onUpdated?: () => void
}) {
  const departmentId = useAuthStore((s) => s.user?.departmentId)
  const updateMutation = useUpdateMilestoneTemplate(departmentId)

  const form = useMilestoneTemplateForm()

  const [open, setOpen] = useState(false)
  const dto: UpdateMilestoneTemplateDto = form.dto

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          form.hydrateFromTemplate(template)
        }
        setOpen(next)
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <Edit3 className="h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto top-4 translate-y-0 sm:top-[50%] sm:translate-y-[-50%]">
        <DialogHeader>
          <DialogTitle>Edit milestone template</DialogTitle>
          <DialogDescription>Changes apply to the whole template milestone list.</DialogDescription>
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
          isPending={updateMutation.isPending}
          submitLabel="Save"
          pendingLabel="Saving"
          onSubmit={async () => {
            form.setLocalError(null)
            const err = form.validate()
            if (err) {
              form.setLocalError(err)
              return
            }

            try {
              await updateMutation.mutateAsync({ templateId: template.templateId, dto })
              toast.success("Milestone template updated.")
              setOpen(false)
              onUpdated?.()
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : "Failed to update milestone template"
              )
            }
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
