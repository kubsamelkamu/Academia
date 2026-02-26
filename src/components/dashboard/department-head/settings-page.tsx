"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/auth-store"
import { CalendarDays, CheckCircle2, ListChecks, Settings2 } from "lucide-react"

type PhaseStatus = "Planned" | "Active" | "Completed"

interface AcademicPhase {
  id: string
  name: string
  startDate: string
  endDate: string
  status: PhaseStatus
}

interface DepartmentConfig {
  key: string
  label: string
  value: string
  hint: string
}

const initialPhases: AcademicPhase[] = [
  {
    id: "phase-1",
    name: "Title Submission",
    startDate: "2026-02-10",
    endDate: "2026-02-28",
    status: "Active",
  },
  {
    id: "phase-2",
    name: "Committee Review",
    startDate: "2026-03-01",
    endDate: "2026-03-15",
    status: "Planned",
  },
  {
    id: "phase-3",
    name: "Proposal Defense",
    startDate: "2026-03-20",
    endDate: "2026-04-05",
    status: "Planned",
  },
]

const initialConfigs: DepartmentConfig[] = [
  {
    key: "maxTitles",
    label: "Max title submissions per student",
    value: "2",
    hint: "Controls how many title attempts are allowed in one cycle.",
  },
  {
    key: "reviewDays",
    label: "Committee review SLA (days)",
    value: "7",
    hint: "Expected review turnaround from submission date.",
  },
  {
    key: "advisorLoad",
    label: "Advisor max concurrent projects",
    value: "6",
    hint: "Used during advisor assignment and balancing.",
  },
]

export function DepartmentHeadSettingsPage() {
  return <DepartmentHeadSettingsPageContent />
}

export function DepartmentHeadSettingsPageContent({ embedded = false }: { embedded?: boolean }) {
  const [phases, setPhases] = useState<AcademicPhase[]>(initialPhases)
  const [configs, setConfigs] = useState<DepartmentConfig[]>(initialConfigs)
  const [calendarPublished, setCalendarPublished] = useState(false)

  const user = useAuthStore((s) => s.user)

  const [newPhaseName, setNewPhaseName] = useState("")
  const [newPhaseStart, setNewPhaseStart] = useState("")
  const [newPhaseEnd, setNewPhaseEnd] = useState("")

  const activePhases = useMemo(() => phases.filter((item) => item.status === "Active").length, [phases])
  const completedPhases = useMemo(() => phases.filter((item) => item.status === "Completed").length, [phases])

  const verificationStatus = user?.tenantVerification?.status ?? null
  const verificationLabel =
    verificationStatus === "PENDING"
      ? "Pending"
      : verificationStatus === "APPROVED"
      ? "Approved"
      : verificationStatus === "REJECTED"
      ? "Rejected"
      : "Not submitted"

  const verificationBadgeVariant =
    verificationStatus === "APPROVED"
      ? "default"
      : verificationStatus === "PENDING"
      ? "secondary"
      : verificationStatus === "REJECTED"
      ? "destructive"
      : "outline"

  const addPhase = () => {
    if (newPhaseName.trim().length < 3 || newPhaseStart.length === 0 || newPhaseEnd.length === 0) {
      return
    }

    const nextPhase: AcademicPhase = {
      id: `phase-${Date.now()}`,
      name: newPhaseName.trim(),
      startDate: newPhaseStart,
      endDate: newPhaseEnd,
      status: "Planned",
    }

    setPhases((current) => [...current, nextPhase])
    setNewPhaseName("")
    setNewPhaseStart("")
    setNewPhaseEnd("")
  }

  const updatePhaseStatus = (phaseId: string, status: PhaseStatus) => {
    setPhases((current) => current.map((phase) => (phase.id === phaseId ? { ...phase, status } : phase)))
  }

  const updateConfigValue = (key: string, value: string) => {
    setConfigs((current) => current.map((item) => (item.key === key ? { ...item, value } : item)))
  }

  const header = (
    <DashboardPageHeader
      title="Department Account & Settings"
      description="Create the academic calendar for project phases and manage governance configuration professionally."
      badge="Department Head"
      actions={
        <Button
          type="button"
          variant={calendarPublished ? "secondary" : "default"}
          onClick={() => setCalendarPublished((current) => !current)}
        >
          {calendarPublished ? "Published" : "Publish Calendar"}
        </Button>
      }
    />
  )

  return (
    <div className={embedded ? "space-y-6" : "space-y-6"}>
      {embedded ? null : header}

      <DashboardKpiGrid
        items={[
          {
            title: "Total Phases",
            value: `${phases.length}`,
            note: "Configured in this academic cycle",
            icon: CalendarDays,
          },
          {
            title: "Active Phases",
            value: `${activePhases}`,
            note: "Currently in progress",
            icon: ListChecks,
          },
          {
            title: "Completed Phases",
            value: `${completedPhases}`,
            note: "Closed with outcomes",
            icon: CheckCircle2,
          },
          {
            title: "Configurations",
            value: `${configs.length}`,
            note: "Policy controls available",
            icon: Settings2,
          },
        ]}
      />

      <DashboardSectionCard
        title="Institution Verification"
        description="Submit a document for admin review. This doesn’t block dashboard access."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">Status</span>
              <Badge
                variant={verificationBadgeVariant}
                className={
                  verificationStatus === "APPROVED"
                    ? "bg-emerald-600 text-white hover:bg-emerald-600/90 dark:bg-emerald-500 dark:hover:bg-emerald-500/90"
                    : undefined
                }
              >
                {verificationLabel}
              </Badge>
            </div>
            {verificationStatus === "REJECTED" && user?.tenantVerification?.lastReviewReason ? (
              <p className="text-xs text-muted-foreground">
                Reason: {user.tenantVerification.lastReviewReason}
              </p>
            ) : null}
          </div>

          <Button asChild variant="outline">
            <Link href="/dashboard/verify-institution">View / Submit</Link>
          </Button>
        </div>
      </DashboardSectionCard>

      <div className="grid gap-4 xl:grid-cols-3">
        <DashboardSectionCard
          className="xl:col-span-2"
          title="Academic Calendar • Project Phases"
          description="Define phase windows and move them from planned to active and completed."
        >
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <Input
              value={newPhaseName}
              onChange={(event) => setNewPhaseName(event.target.value)}
              placeholder="Phase name"
            />
            <Input value={newPhaseStart} onChange={(event) => setNewPhaseStart(event.target.value)} type="date" />
            <Input value={newPhaseEnd} onChange={(event) => setNewPhaseEnd(event.target.value)} type="date" />
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button type="button" onClick={addPhase}>Add Project Phase</Button>
            <Badge variant={calendarPublished ? "secondary" : "outline"}>
              {calendarPublished ? "Calendar Published" : "Draft Calendar"}
            </Badge>
          </div>

          <div className="space-y-3">
            {phases.map((phase) => (
              <div key={phase.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{phase.name}</p>
                  <Badge
                    variant={
                      phase.status === "Completed"
                        ? "secondary"
                        : phase.status === "Active"
                        ? "default"
                        : "outline"
                    }
                  >
                    {phase.status}
                  </Badge>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  {phase.startDate} to {phase.endDate}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {phase.status !== "Active" ? (
                    <Button size="sm" variant="outline" onClick={() => updatePhaseStatus(phase.id, "Active")}>
                      Set Active
                    </Button>
                  ) : null}

                  {phase.status !== "Completed" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updatePhaseStatus(phase.id, "Completed")}
                    >
                      Mark Completed
                    </Button>
                  ) : null}

                  {phase.status !== "Planned" ? (
                    <Button size="sm" variant="outline" onClick={() => updatePhaseStatus(phase.id, "Planned")}>
                      Move to Planned
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Department Configurations"
          description="Adjust key rules for title submissions, review speed, and assignment capacity."
        >
          <div className="space-y-3">
            {configs.map((config) => (
              <div key={config.key} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{config.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{config.hint}</p>
                <Input
                  className="mt-2"
                  value={config.value}
                  onChange={(event) => updateConfigValue(config.key, event.target.value)}
                />
              </div>
            ))}

            <Button type="button" variant="outline" className="w-full">
              Save Configuration Changes
            </Button>
          </div>
        </DashboardSectionCard>
      </div>
    </div>
  )
}
