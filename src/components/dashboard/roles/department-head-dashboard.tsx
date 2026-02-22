"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DashboardEmptyState,
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDepartmentHeadDashboard } from "@/lib/hooks/use-department-head-dashboard"
import { DepartmentHeadKpi } from "@/types/dashboard"
import {
  Building2,
  Calendar,
  CheckCircle2,
  FileClock,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react"
import { DashboardKpiSkeleton, DashboardSectionsSkeleton } from "./shared-skeletons"

const kpiIcons: Record<DepartmentHeadKpi["icon"], LucideIcon> = {
  building2: Building2,
  users: Users,
  checkCircle2: CheckCircle2,
  shieldAlert: ShieldAlert,
}

export function DepartmentHeadDashboard() {
  const { data, isLoading } = useDepartmentHeadDashboard()

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Department Head Dashboard"
        description="Monitor departments, approvals, and academic execution from one place."
      />

      {isLoading ? (
        <DashboardKpiSkeleton />
      ) : (
        <DashboardKpiGrid
          items={(data?.kpis ?? []).map((card) => {
            const Icon = kpiIcons[card.icon]
            return {
              title: card.title,
              value: card.value,
              note: card.note,
              icon: Icon,
            }
          })}
        />
      )}

      {isLoading ? (
        <DashboardSectionsSkeleton />
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-3">
            <DashboardSectionCard
              className="xl:col-span-2"
              title="Urgent Approvals"
              description="Requests and conflicts requiring your attention."
            >
              {!data || data.urgentApprovals.length === 0 ? (
                <DashboardEmptyState
                  title="No urgent approvals"
                  description="Approval requests and conflicts will appear here when ready."
                />
              ) : (
                <div className="space-y-3">
                  {data.urgentApprovals.map((item) => (
                    <div key={item.title} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <FileClock className="h-4 w-4 text-muted-foreground" />
                            <p className="truncate text-sm font-medium">{item.title}</p>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                        </div>
                        <Badge
                          className="shrink-0"
                          variant={
                            item.priority === "High"
                              ? "destructive"
                              : item.priority === "Medium"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {item.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DashboardSectionCard>

            <DashboardSectionCard
              title="Coordinator & Faculty Status"
              description="Active capacity and blocked items by unit."
            >
              {!data || data.coordinatorStatus.length === 0 ? (
                <DashboardEmptyState
                  title="No status available"
                  description="Coordinator and faculty capacity will appear here."
                />
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Active</TableHead>
                        <TableHead className="text-right">Blocked</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.coordinatorStatus.map((row) => (
                        <TableRow key={row.name}>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell className="text-right">{row.active}</TableCell>
                          <TableCell className="text-right">{row.blocked}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="space-y-3">
                    {data.coordinatorStatus.map((row) => {
                      const total = row.active + row.blocked
                      const blockedPercent = total > 0 ? Math.round((row.blocked / total) * 100) : 0

                      return (
                        <div key={`${row.name}-progress`} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">{row.name}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Active {row.active}</Badge>
                              <Badge variant={row.blocked > 0 ? "destructive" : "secondary"}>
                                Blocked {row.blocked}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-3">
                            <Progress value={blockedPercent} />
                            <p className="mt-2 text-xs text-muted-foreground">
                              {blockedPercent}% blocked
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </DashboardSectionCard>
          </div>

          <DashboardSectionCard
            title="Upcoming Defenses"
            description="Scheduled sessions published by coordinators."
          >
            {!data || data.upcomingDefenses.length === 0 ? (
              <DashboardEmptyState
                title="No defenses scheduled yet"
                description="Upcoming defense sessions will appear once schedules are published."
              />
            ) : (
              <div className="space-y-3">
                {data.upcomingDefenses.map((item) => (
                  <div key={`${item.title}-${item.date}`} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.date}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.committee}</p>
                      </div>
                      <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardSectionCard>
        </>
      )}
    </div>
  )
}
