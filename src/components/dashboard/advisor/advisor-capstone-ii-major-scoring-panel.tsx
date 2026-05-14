"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

import {
  ADVISOR_CAPSTONE_II_MAJOR_CRITERIA,
  ADVISOR_CII_RUBRIC_TOTAL_PERCENT,
  type AdvisorCapstoneIIMajorCriterionMeta,
} from "./advisor-capstone-ii-implementation-rubric-data"

const CHUNK_SIZE = 5

function CriterionSliderRow({
  criterion,
  scores,
  onScoreChange,
  disabled,
  compact,
}: {
  criterion: AdvisorCapstoneIIMajorCriterionMeta
  scores: Record<string, number>
  onScoreChange: (id: string, value: number) => void
  disabled: boolean
  compact: boolean
}) {
  const max = criterion.maxPercent
  const raw = scores[criterion.id] ?? 0
  const fillPct = max > 0 ? (raw / max) * 100 : 0

  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-card/50 p-3 shadow-sm",
        compact && "p-2.5",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground">
          <span className="tabular-nums text-primary">I.{criterion.number}</span> {criterion.title}
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
        aria-label={`Implementation I.${criterion.number}. ${criterion.title}`}
      />
      <Progress value={fillPct} className="mt-2 h-1.5 bg-muted/80" />
    </div>
  )
}

export function AdvisorCapstoneIIMajorScoringPanel({
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
  const cap = ADVISOR_CII_RUBRIC_TOTAL_PERCENT
  const over = totalEarned > cap + 0.001

  const chunks: AdvisorCapstoneIIMajorCriterionMeta[][] = []
  for (let i = 0; i < ADVISOR_CAPSTONE_II_MAJOR_CRITERIA.length; i += CHUNK_SIZE) {
    chunks.push([...ADVISOR_CAPSTONE_II_MAJOR_CRITERIA.slice(i, i + CHUNK_SIZE)])
  }

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
            Twenty implementation criteria (I.1–I.20). The sum is saved as the single 0–100 advisor mark for this student.
          </p>
        )}
      </div>

      {chunks.map((slice, chunkIdx) => {
        const start = slice[0]?.number ?? 1
        const end = slice[slice.length - 1]?.number ?? start
        return (
          <div key={`chunk-${chunkIdx}`} className="space-y-3">
            {chunkIdx > 0 ? <Separator /> : null}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                I.{start}–I.{end}
              </Badge>
              <p className={cn("text-xs font-medium text-muted-foreground", compact && "text-[11px]")}>
                System implementation checklist
              </p>
            </div>
            <div className="space-y-4">
              {slice.map((criterion) => (
                <CriterionSliderRow
                  key={criterion.id}
                  criterion={criterion}
                  scores={scores}
                  onScoreChange={onScoreChange}
                  disabled={disabled}
                  compact={compact}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
