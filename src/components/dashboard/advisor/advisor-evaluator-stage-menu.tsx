"use client"

import Link from "next/link"
import * as React from "react"
import type { ReactElement } from "react"
import { useRouter } from "next/navigation"

import type { AdvisorEvaluationDashboardStage } from "@/lib/api/advisor"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type AdvisorEvaluatorStage = "capstone-i" | "capstone-ii"

const STAGE_OPTIONS: Array<{ stage: AdvisorEvaluatorStage; label: string }> = [
  { stage: "capstone-i", label: "Capstone I" },
  { stage: "capstone-ii", label: "Capstone II" },
]

/** Deep link for the evaluator scoring workspace (always uses canonical capstone-i / capstone-ii query). */
export function getAdvisorEvaluatorEvaluationHref(projectId: string, stage: AdvisorEvaluatorStage) {
  return `/dashboard/advisor/evaluator/evaluate/${projectId}?stage=${stage}`
}

/**
 * Parses ?stage= from the URL. Accepts advisor-dashboard tokens (`CAPSTONE_I`) as well as `capstone-i`.
 */
export function parseAdvisorEvaluatorStageParam(raw: string | null | undefined): AdvisorEvaluatorStage | null {
  if (raw === null || raw === undefined) return null
  const s = String(raw).trim()
  if (!s) return null
  const compact = s.toUpperCase().replace(/-/g, "_").replace(/\s+/g, "_")
  if (compact === "CAPSTONE_II" || compact === "CAPSTONE2") return "capstone-ii"
  if (compact === "CAPSTONE_I" || compact === "CAPSTONE1") return "capstone-i"
  const lower = s.toLowerCase()
  if (lower === "capstone-ii" || lower === "capstone-2") return "capstone-ii"
  if (lower === "capstone-i" || lower === "capstone-1") return "capstone-i"
  return null
}

export function dashboardStageToEvaluatorRouteStage(
  stage: AdvisorEvaluationDashboardStage,
): AdvisorEvaluatorStage {
  return stage === "CAPSTONE_II" ? "capstone-ii" : "capstone-i"
}

function evaluationHref(projectId: string, stage: AdvisorEvaluatorStage) {
  return getAdvisorEvaluatorEvaluationHref(projectId, stage)
}

type AdvisorEvaluatorStageMenuProps = {
  projectId: string
  trigger: ReactElement
  align?: "start" | "center" | "end"
}

export function AdvisorEvaluatorStageMenu({ projectId, trigger, align = "end" }: AdvisorEvaluatorStageMenuProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  const handleStageSelect = (stage: AdvisorEvaluatorStage) => (event: Event) => {
    event.preventDefault()
    setOpen(false)

    window.setTimeout(() => {
      router.push(evaluationHref(projectId, stage))
    }, 0)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-52" portal={false}>
        <DropdownMenuLabel>Choose capstone</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {STAGE_OPTIONS.map((option) => (
          <DropdownMenuItem key={option.stage} asChild onSelect={handleStageSelect(option.stage)}>
            <Link href={evaluationHref(projectId, option.stage)}>{option.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}