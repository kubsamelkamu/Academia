"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Loader2, Plus, Trash2 } from "lucide-react"

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
import { useCreateMilestoneTemplate } from "@/lib/hooks/use-milestone-templates"

import type {
  CreateMilestoneTemplateDto,
  CreateMilestoneTemplateMilestoneDto,
} from "@/types/milestone-templates"

function parseRequiredDocuments(input: string): string[] {
  const items = input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
  return Array.from(new Set(items))
}

function buildMilestoneDraft(sequence: number): CreateMilestoneTemplateMilestoneDto {
  return {
    sequence,
    title: "",
    description: "",
    defaultDurationDays: 14,
    hasDeliverable: true,
    requiredDocuments: [],
    isRequired: true,
  }
}

export function CreateMilestoneTemplateDialog({
  onCreated,
}: {
  onCreated?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [milestones, setMilestones] = useState<CreateMilestoneTemplateMilestoneDto[]>([
    buildMilestoneDraft(1),
  ])
  const [requiredDocsTextBySeq, setRequiredDocsTextBySeq] = useState<Record<number, string>>({
    1: "",
  })
  const [localError, setLocalError] = useState<string | null>(null)

  const resetForm = () => {
    setName("")
    setDescription("")
    setIsActive(true)
    setMilestones([buildMilestoneDraft(1)])
    setRequiredDocsTextBySeq({ 1: "" })
    setLocalError(null)
  }

  const dto: CreateMilestoneTemplateDto = useMemo(() => {
    return {
      name: name.trim(),
      description: description.trim().length ? description.trim() : undefined,
      isActive,
      milestones: milestones
        .map((m) => {
          const docsText = requiredDocsTextBySeq[m.sequence] ?? ""
          const requiredDocuments = m.hasDeliverable ? parseRequiredDocuments(docsText) : []
          return {
            ...m,
            title: m.title.trim(),
            description: m.description?.toString().trim().length ? m.description?.toString().trim() : null,
            requiredDocuments,
          }
        })
        .sort((a, b) => a.sequence - b.sequence),
    }
  }, [name, description, isActive, milestones, requiredDocsTextBySeq])

  const validate = (): string | null => {
    if (dto.name.length < 3) {
      return "Template name must be at least 3 characters."
    }

    if (!dto.milestones.length) {
      return "Add at least one milestone."
    }

    const sequences = dto.milestones.map((m) => m.sequence)
    const uniqueSeq = new Set(sequences)
    if (uniqueSeq.size !== sequences.length) {
      return "Milestone sequence numbers must be unique."
    }

    for (const m of dto.milestones) {
      if (!Number.isFinite(m.sequence) || m.sequence < 1) {
        return "Milestone sequence must be a positive number."
      }
      if (m.title.trim().length < 2) {
        return `Milestone #${m.sequence}: title is required.`
      }
      if (!Number.isFinite(m.defaultDurationDays) || m.defaultDurationDays < 1) {
        return `Milestone #${m.sequence}: duration must be at least 1 day.`
      }
    }

    return null
  }

  const nextSequence = useMemo(() => {
    const maxSeq = milestones.reduce((acc, m) => Math.max(acc, m.sequence), 0)
    return maxSeq + 1
  }, [milestones])

  const addMilestone = () => {
    const seq = nextSequence
    setMilestones((current) => [...current, buildMilestoneDraft(seq)])
    setRequiredDocsTextBySeq((current) => ({ ...current, [seq]: "" }))
  }

  const removeMilestone = (sequence: number) => {
    setMilestones((current) => current.filter((m) => m.sequence !== sequence))
    setRequiredDocsTextBySeq((current) => {
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

  const departmentId = useAuthStore((s) => s.user?.departmentId)
  const createMutation = useCreateMilestoneTemplate(departmentId)

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

        <CreateMilestoneTemplateDialogBody
          dto={dto}
          localError={localError}
          setLocalError={setLocalError}
          milestones={milestones}
          setName={setName}
          setDescription={setDescription}
          name={name}
          description={description}
          isActive={isActive}
          setIsActive={setIsActive}
          addMilestone={addMilestone}
          removeMilestone={removeMilestone}
          setMilestone={setMilestone}
          requiredDocsTextBySeq={requiredDocsTextBySeq}
          setRequiredDocsTextBySeq={setRequiredDocsTextBySeq}
          validate={validate}
          isPending={createMutation.isPending}
          onSubmit={async () => {
            setLocalError(null)
            const err = validate()
            if (err) {
              setLocalError(err)
              return
            }
            try {
              await createMutation.mutateAsync(dto)
              toast.success("Milestone template created.")
              setOpen(false)
              onCreated?.()
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : "Failed to create milestone template"
              )
            }
          }}
          onCreated={() => {
            setOpen(false)
            onCreated?.()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function CreateMilestoneTemplateDialogBody(props: {
  dto: CreateMilestoneTemplateDto
  milestones: CreateMilestoneTemplateMilestoneDto[]
  name: string
  description: string
  isActive: boolean
  localError: string | null
  setLocalError: (value: string | null) => void
  setName: (value: string) => void
  setDescription: (value: string) => void
  setIsActive: (value: boolean) => void
  addMilestone: () => void
  removeMilestone: (sequence: number) => void
  setMilestone: (sequence: number, patch: Partial<CreateMilestoneTemplateMilestoneDto>) => void
  requiredDocsTextBySeq: Record<number, string>
  setRequiredDocsTextBySeq: (next: Record<number, string> | ((cur: Record<number, string>) => Record<number, string>)) => void
  validate: () => string | null
  isPending: boolean
  onSubmit: () => Promise<void>
  onCreated: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Template name</Label>
          <Input value={props.name} onChange={(e) => props.setName(e.target.value)} placeholder="Standard" />
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={props.isActive ? "secondary" : "outline"}
              onClick={() => props.setIsActive(true)}
            >
              Active
            </Button>
            <Button
              type="button"
              size="sm"
              variant={!props.isActive ? "secondary" : "outline"}
              onClick={() => props.setIsActive(false)}
            >
              Inactive
            </Button>
          </div>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Description (optional)</Label>
          <Textarea
            value={props.description}
            onChange={(e) => props.setDescription(e.target.value)}
            placeholder="Default departmental schedule"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium">Milestones</p>
            <p className="text-xs text-muted-foreground">Sequence numbers must be unique.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={props.addMilestone}>
            <Plus className="h-4 w-4" />
            Add milestone
          </Button>
        </div>

        <div className="space-y-3">
          {props.milestones
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

                        // Move docs text mapping key when sequence changes.
                        props.setRequiredDocsTextBySeq((current) => {
                          const next = { ...current }
                          const prevText = next[m.sequence] ?? ""
                          delete next[m.sequence]
                          next[nextSeq] = prevText
                          return next
                        })

                        // Update milestone sequence.
                        props.setMilestone(m.sequence, { sequence: nextSeq })
                      }}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-4">
                    <Label>Title</Label>
                    <Input
                      value={m.title}
                      onChange={(e) => props.setMilestone(m.sequence, { title: e.target.value })}
                      placeholder="Proposal"
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
                        props.setMilestone(m.sequence, {
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
                        onClick={() => props.setMilestone(m.sequence, { hasDeliverable: !m.hasDeliverable })}
                      >
                        Deliverable
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={m.isRequired ? "secondary" : "outline"}
                        onClick={() => props.setMilestone(m.sequence, { isRequired: !m.isRequired })}
                      >
                        Required
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => props.removeMilestone(m.sequence)}
                        disabled={props.milestones.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-6">
                    <Label>Description (optional)</Label>
                    <Input
                      value={m.description ?? ""}
                      onChange={(e) => props.setMilestone(m.sequence, { description: e.target.value })}
                      placeholder="Submit proposal"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-6">
                    <Label>Required documents (comma-separated)</Label>
                    <Input
                      value={props.requiredDocsTextBySeq[m.sequence] ?? ""}
                      onChange={(e) =>
                        props.setRequiredDocsTextBySeq((current) => ({
                          ...current,
                          [m.sequence]: e.target.value,
                        }))
                      }
                      placeholder="proposal.pdf, srs.docx"
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {props.localError ? <p className="text-sm text-destructive">{props.localError}</p> : null}

      <DialogFooter showCloseButton>
        <Button type="button" onClick={props.onSubmit} disabled={props.isPending}>
          {props.isPending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating
            </span>
          ) : (
            "Create"
          )}
        </Button>
      </DialogFooter>
    </div>
  )
}
