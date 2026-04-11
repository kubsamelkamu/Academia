"use client"

import Link from "next/link"
import type { ReactElement } from "react"

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

function evaluationHref(projectId: string, stage: AdvisorEvaluatorStage) {
  return `/dashboard/advisor/evaluator/evaluate/${projectId}?stage=${stage}`
}

type AdvisorEvaluatorStageMenuProps = {
  projectId: string
  trigger: ReactElement
  align?: "start" | "center" | "end"
}

export function AdvisorEvaluatorStageMenu({ projectId, trigger, align = "end" }: AdvisorEvaluatorStageMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-52">
        <DropdownMenuLabel>Choose capstone</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {STAGE_OPTIONS.map((option) => (
          <DropdownMenuItem key={option.stage} asChild>
            <Link href={evaluationHref(projectId, option.stage)}>{option.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}