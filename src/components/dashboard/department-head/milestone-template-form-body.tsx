"use client"

import { Loader2, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type {
  CreateMilestoneTemplateDto,
  CreateMilestoneTemplateMilestoneDto,
} from "@/types/milestone-templates"

export function MilestoneTemplateFormBody(props: {
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
  setRequiredDocsTextBySeq: (
    next:
      | Record<number, string>
      | ((cur: Record<number, string>) => Record<number, string>)
  ) => void
  validate: () => string | null
  isPending: boolean
  submitLabel: string
  pendingLabel: string
  onSubmit: () => Promise<void>
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Template name</Label>
          <Input
            value={props.name}
            onChange={(e) => props.setName(e.target.value)}
            placeholder="Standard"
          />
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

                        props.setRequiredDocsTextBySeq((current) => {
                          const next = { ...current }
                          const prevText = next[m.sequence] ?? ""
                          delete next[m.sequence]
                          next[nextSeq] = prevText
                          return next
                        })

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
                        onClick={() =>
                          props.setMilestone(m.sequence, { hasDeliverable: !m.hasDeliverable })
                        }
                      >
                        Deliverable
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={m.isRequired ? "secondary" : "outline"}
                        onClick={() =>
                          props.setMilestone(m.sequence, { isRequired: !m.isRequired })
                        }
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
                      onChange={(e) =>
                        props.setMilestone(m.sequence, { description: e.target.value })
                      }
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
              {props.pendingLabel}
            </span>
          ) : (
            props.submitLabel
          )}
        </Button>
      </DialogFooter>
    </div>
  )
}
