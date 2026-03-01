"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Edit3, Loader2, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { useUpdateMilestoneTemplate } from "@/lib/hooks/use-milestone-templates"
import type {
  CreateMilestoneTemplateMilestoneDto,
  MilestoneTemplate,
  UpdateMilestoneTemplateDto,
} from "@/types/milestone-templates"

function joinDocuments(docs: string[] | undefined): string {
  return (docs ?? []).join(", ")
}

function parseDocuments(input: string): string[] {
  const items = input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
  return Array.from(new Set(items))
}

export function EditMilestoneTemplateDialog({
  template,
  onUpdated,
}: {
  template: MilestoneTemplate
  onUpdated?: () => void
}) {
  const departmentId = useAuthStore((s) => s.user?.departmentId)
  const updateMutation = useUpdateMilestoneTemplate(departmentId)

  const [open, setOpen] = useState(false)
  const [name, setName] = useState(template.name)
  const [description, setDescription] = useState(template.description ?? "")
  const [isActive, setIsActive] = useState(Boolean(template.isActive))
  const [milestones, setMilestones] = useState<CreateMilestoneTemplateMilestoneDto[]>(
    template.milestones.map((m) => ({
      sequence: m.sequence,
      title: m.title,
      description: m.description ?? "",
      defaultDurationDays: m.defaultDurationDays,
      hasDeliverable: m.hasDeliverable,
      requiredDocuments: m.requiredDocuments ?? [],
      isRequired: m.isRequired,
    }))
  )
  const [docsTextBySeq, setDocsTextBySeq] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {}
    for (const m of template.milestones) {
      initial[m.sequence] = joinDocuments(m.requiredDocuments)
    }
    return initial
  })
  const [localError, setLocalError] = useState<string | null>(null)

  const hydrateFromTemplate = () => {
    setName(template.name)
    setDescription(template.description ?? "")
    setIsActive(Boolean(template.isActive))
    setMilestones(
      template.milestones.map((m) => ({
        sequence: m.sequence,
        title: m.title,
        description: m.description ?? "",
        defaultDurationDays: m.defaultDurationDays,
        hasDeliverable: m.hasDeliverable,
        requiredDocuments: m.requiredDocuments ?? [],
        isRequired: m.isRequired,
      }))
    )
    setDocsTextBySeq(() => {
      const initial: Record<number, string> = {}
      for (const m of template.milestones) {
        initial[m.sequence] = joinDocuments(m.requiredDocuments)
      }
      return initial
    })
    setLocalError(null)
  }

  const nextSequence = useMemo(() => {
    const maxSeq = milestones.reduce((acc, m) => Math.max(acc, m.sequence), 0)
    return maxSeq + 1
  }, [milestones])

  const addMilestone = () => {
    const seq = nextSequence
    setMilestones((current) => [
      ...current,
      {
        sequence: seq,
        title: "",
        description: "",
        defaultDurationDays: 14,
        hasDeliverable: true,
        requiredDocuments: [],
        isRequired: true,
      },
    ])
    setDocsTextBySeq((current) => ({ ...current, [seq]: "" }))
  }

  const removeMilestone = (sequence: number) => {
    setMilestones((current) => current.filter((m) => m.sequence !== sequence))
    setDocsTextBySeq((current) => {
      const next = { ...current }
      delete next[sequence]
      return next
    })
  }

  const setMilestone = (sequence: number, patch: Partial<CreateMilestoneTemplateMilestoneDto>) => {
    setMilestones((current) =>
      current.map((m) => (m.sequence === sequence ? { ...m, ...patch } : m))
    )
  }

  const dto: UpdateMilestoneTemplateDto = useMemo(() => {
    return {
      name: name.trim(),
      description: description.trim().length ? description.trim() : undefined,
      isActive,
      milestones: milestones
        .map((m) => {
          const docsText = docsTextBySeq[m.sequence] ?? ""
          const requiredDocuments = m.hasDeliverable ? parseDocuments(docsText) : []
          return {
            ...m,
            title: m.title.trim(),
            description: m.description?.toString().trim().length
              ? m.description?.toString().trim()
              : null,
            requiredDocuments,
          }
        })
        .sort((a, b) => a.sequence - b.sequence),
    }
  }, [name, description, isActive, milestones, docsTextBySeq])

  const validate = (): string | null => {
    if ((dto.name ?? "").trim().length < 3) {
      return "Template name must be at least 3 characters."
    }
    const list = dto.milestones ?? []
    if (!list.length) {
      return "Add at least one milestone."
    }
    const sequences = list.map((m) => m.sequence)
    if (new Set(sequences).size !== sequences.length) {
      return "Milestone sequence numbers must be unique."
    }
    for (const m of list) {
      if (!Number.isFinite(m.sequence) || m.sequence < 1) {
        return "Milestone sequence must be a positive number."
      }
      if ((m.title ?? "").trim().length < 2) {
        return `Milestone #${m.sequence}: title is required.`
      }
      if (!Number.isFinite(m.defaultDurationDays) || m.defaultDurationDays < 1) {
        return `Milestone #${m.sequence}: duration must be at least 1 day.`
      }
    }
    return null
  }

  const onSubmit = async () => {
    setLocalError(null)
    const err = validate()
    if (err) {
      setLocalError(err)
      return
    }

    try {
      await updateMutation.mutateAsync({ templateId: template.templateId, dto })
      toast.success("Milestone template updated.")
      setOpen(false)
      onUpdated?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update milestone template")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          hydrateFromTemplate()
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

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Template name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
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

            <div className="space-y-2 sm:col-span-2">
              <Label>Description (optional)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Milestones</p>
                <p className="text-xs text-muted-foreground">Sequence numbers must be unique.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
                <Plus className="h-4 w-4" />
                Add milestone
              </Button>
            </div>

            <div className="space-y-3">
              {milestones
                .slice()
                .sort((a, b) => a.sequence - b.sequence)
                .map((m) => (
                  <div key={m.sequence} className="rounded-lg border p-3">
                    <div className="grid gap-3 md:grid-cols-12">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Seq</Label>
                        <Input
                          type="number"
                          min={1}
                          inputMode="numeric"
                          value={m.sequence}
                          onChange={(e) => {
                            const nextSeq = e.target.valueAsNumber
                            if (!Number.isFinite(nextSeq)) return

                            setDocsTextBySeq((current) => {
                              const next = { ...current }
                              const prevText = next[m.sequence] ?? ""
                              delete next[m.sequence]
                              next[nextSeq] = prevText
                              return next
                            })

                            setMilestone(m.sequence, { sequence: nextSeq })
                          }}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-4">
                        <Label>Title</Label>
                        <Input
                          value={m.title}
                          onChange={(e) => setMilestone(m.sequence, { title: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-3">
                        <Label>Duration (days)</Label>
                        <Input
                          type="number"
                          min={1}
                          inputMode="numeric"
                          value={m.defaultDurationDays}
                          onChange={(e) =>
                            setMilestone(m.sequence, {
                              defaultDurationDays: e.target.valueAsNumber,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2 md:col-span-3">
                        <Label>Actions</Label>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={m.hasDeliverable ? "secondary" : "outline"}
                            onClick={() =>
                              setMilestone(m.sequence, { hasDeliverable: !m.hasDeliverable })
                            }
                          >
                            Deliverable
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={m.isRequired ? "secondary" : "outline"}
                            onClick={() => setMilestone(m.sequence, { isRequired: !m.isRequired })}
                          >
                            Required
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeMilestone(m.sequence)}
                            disabled={milestones.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-6">
                        <Label>Description (optional)</Label>
                        <Input
                          value={m.description ?? ""}
                          onChange={(e) => setMilestone(m.sequence, { description: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-6">
                        <Label>Required documents (comma-separated)</Label>
                        <Input
                          value={docsTextBySeq[m.sequence] ?? ""}
                          onChange={(e) =>
                            setDocsTextBySeq((current) => ({
                              ...current,
                              [m.sequence]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {localError ? <p className="text-sm text-destructive">{localError}</p> : null}

          <DialogFooter showCloseButton>
            <Button type="button" onClick={onSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving
                </span>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
