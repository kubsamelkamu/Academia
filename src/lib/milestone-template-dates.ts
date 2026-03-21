import type { MilestoneTemplate } from "@/types/milestone-templates"

export function sumTemplateDurationDays(template: MilestoneTemplate): number {
  return (template.milestones ?? []).reduce(
    (total, milestone) => total + Math.max(0, milestone.defaultDurationDays ?? 0),
    0
  )
}

export function getTemplateDueDate(template: MilestoneTemplate): string {
  const createdDate = new Date(template.createdAt)
  if (Number.isNaN(createdDate.getTime())) return template.createdAt

  const dueDate = new Date(createdDate)
  dueDate.setDate(dueDate.getDate() + sumTemplateDurationDays(template))
  return dueDate.toISOString().split("T")[0]
}
