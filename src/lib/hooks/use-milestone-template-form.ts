import { useMemo, useState } from "react"

import type {
  CreateMilestoneTemplateDto,
  CreateMilestoneTemplateMilestoneDto,
  MilestoneTemplate,
} from "@/types/milestone-templates"

function parseCommaList(input: string): string[] {
  const items = input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
  return Array.from(new Set(items))
}

function joinCommaList(items: string[] | undefined): string {
  return (items ?? []).join(", ")
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

function toNullableDescription(value: unknown): string | null {
  const text = String(value ?? "").trim()
  return text.length ? text : null
}

export function useMilestoneTemplateForm() {
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

  const dto: CreateMilestoneTemplateDto = useMemo(() => {
    return {
      name: name.trim(),
      description: description.trim().length ? description.trim() : undefined,
      isActive,
      milestones: milestones
        .map((m) => {
          const docsText = requiredDocsTextBySeq[m.sequence] ?? ""
          const requiredDocuments = m.hasDeliverable ? parseCommaList(docsText) : []
          return {
            ...m,
            title: m.title.trim(),
            description: toNullableDescription(m.description),
            requiredDocuments,
          }
        })
        .sort((a, b) => a.sequence - b.sequence),
    }
  }, [name, description, isActive, milestones, requiredDocsTextBySeq])

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

  const resetToEmpty = () => {
    setName("")
    setDescription("")
    setIsActive(true)
    setMilestones([buildMilestoneDraft(1)])
    setRequiredDocsTextBySeq({ 1: "" })
    setLocalError(null)
  }

  const hydrateFromTemplate = (template: MilestoneTemplate) => {
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
    setRequiredDocsTextBySeq(() => {
      const initial: Record<number, string> = {}
      for (const m of template.milestones) {
        initial[m.sequence] = joinCommaList(m.requiredDocuments)
      }
      return initial
    })
    setLocalError(null)
  }

  return {
    name,
    setName,
    description,
    setDescription,
    isActive,
    setIsActive,
    milestones,
    addMilestone,
    removeMilestone,
    setMilestone,
    requiredDocsTextBySeq,
    setRequiredDocsTextBySeq,
    localError,
    setLocalError,
    dto,
    validate,
    resetToEmpty,
    hydrateFromTemplate,
  }
}
