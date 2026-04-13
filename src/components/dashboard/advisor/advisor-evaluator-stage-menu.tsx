"use client"

import Link from "next/link"
import * as React from "react"
import type { ReactElement } from "react"
import { useRouter } from "next/navigation"

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