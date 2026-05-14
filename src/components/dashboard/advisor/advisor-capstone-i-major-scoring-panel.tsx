"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

import {
  ADVISOR_CAPSTONE_I_MAJOR_CRITERIA,
  ADVISOR_SRS_SDD_RUBRIC_TOTAL_PERCENT,
  type AdvisorMajorCriterionMeta,
} from "./advisor-capstone-srs-sdd-rubric-data"

function MajorBlock({
  sectionLetter,
  sectionTitle,
  criteria,
  scores,
  onScoreChange,
  disabled,
  compact,
}: {
  sectionLetter: "A" | "B"
  sectionTitle: string
  criteria: readonly AdvisorMajorCriterionMeta[]
  scores: Record<string, number>
  onScoreChange: (id: string, value: number) => void
  disabled: boolean
  compact: boolean
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="font-mono">
          Section {sectionLetter}
        </Badge>
        <p className={cn("min-w-0 flex-1 font-semibold text-foreground", compact ? "text-xs" : "text-sm")}>{sectionTitle}</p>
      </div>
      <div className="space-y-4">
        {criteria.map((criterion) => {
          const max = criterion.maxPercent
          const raw = scores[criterion.id] ?? 0
          const fillPct = max > 0 ? (raw / max) * 100 : 0

          return (
            <div
              key={criterion.id}
              className={cn(
                "rounded-xl border border-border/70 bg-card/50 p-3 shadow-sm",
                compact && "p-2.5",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground">
                  <span className="tabular-nums text-primary">{criterion.number}.</span> {criterion.title}
                </p>
                <span className="shrink-0 tabular-nums text-sm font-semibold text-primary">
                  {raw}
                  <span className="font-normal text-muted-foreground"> / {max}</span>
                </span>
              </div>
              <Slider
                className="mt-3"
                min={0}
                max={max}
                step={0.5}
                value={[raw]}
                disabled={disabled}
                onValueChange={(v) => onScoreChange(criterion.id, v[0] ?? 0)}
                aria-label={`${criterion.sectionShort} ${criterion.number}. ${criterion.title}`}
              />
              <Progress value={fillPct} className="mt-2 h-1.5 bg-muted/80" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AdvisorCapstoneIMajorScoringPanel({
  scores,
  onScoreChange,
  totalEarned,
  disabled,
  compact = false,
}: {
  scores: Record<string, number>
  onScoreChange: (criterionId: string, value: number) => void
  totalEarned: number
  disabled: boolean
  compact?: boolean
}) {
  const srs = ADVISOR_CAPSTONE_I_MAJOR_CRITERIA.filter((c) => c.sectionLetter === "A")
  const sdd = ADVISOR_CAPSTONE_I_MAJOR_CRITERIA.filter((c) => c.sectionLetter === "B")
  const cap = ADVISOR_SRS_SDD_RUBRIC_TOTAL_PERCENT
  const over = totalEarned > cap + 0.001

  return (
    <div className={cn("space-y-5", compact && "space-y-4")}>
      <div
        className={cn(
          "rounded-xl border border-primary/25 bg-primary/[0.06] px-4 py-3",
          over && "border-destructive/50 bg-destructive/5",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">Holistic advisor score (from criteria)</p>
          <Badge variant={over ? "destructive" : "secondary"} className="tabular-nums text-sm">
            Σ {totalEarned.toFixed(1)} / {cap}
          </Badge>
        </div>
        <Progress value={Math.min(cap, totalEarned)} className="mt-2 h-2 bg-muted/80" />
        {over ? (
          <p className="mt-2 text-xs text-destructive">Total cannot exceed {cap}. Lower one or more criteria.</p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            Adjust each row (0 up to its max). The sum is saved as the single 0–100 advisor mark for this student.
          </p>
        )}
      </div>

      <MajorBlock
        sectionLetter="A"
        sectionTitle="Software Requirements Specification (SRS)"
        criteria={srs}
        scores={scores}
        onScoreChange={onScoreChange}
        disabled={disabled}
        compact={compact}
      />

      <Separator />

      <MajorBlock
        sectionLetter="B"
        sectionTitle="Software Design Document (SDD)"
        criteria={sdd}
        scores={scores}
        onScoreChange={onScoreChange}
        disabled={disabled}
        compact={compact}
      />
    </div>
  )
}
