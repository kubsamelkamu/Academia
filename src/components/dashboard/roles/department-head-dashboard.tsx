"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Department Head Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor departments, approvals, and academic execution from one place.
        </p>
      </div>

      {isLoading ? (
        <DashboardKpiSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data?.kpis.map((card) => {
            const Icon = kpiIcons[card.icon]

            return (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.note}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {isLoading ? (
        <DashboardSectionsSkeleton />
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileClock className="h-4 w-4" />
                  Urgent Approvals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!data || data.urgentApprovals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No urgent approvals right now.</p>
                ) : (
                  <div className="space-y-3">
                    {data.urgentApprovals.map((item) => (
                      <div key={item.title} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.detail}</p>
                          </div>
                          <Badge variant={item.priority === "High" ? "destructive" : "secondary"}>
                            {item.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Coordinator & Faculty Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.coordinatorStatus.map((row) => (
                    <div key={row.name} className="rounded-lg border p-3">
                      <p className="text-sm font-medium">{row.name}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">Active {row.active}</Badge>
                        <Badge variant={row.blocked > 0 ? "destructive" : "secondary"}>
                          Blocked {row.blocked}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Upcoming Defenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!data || data.upcomingDefenses.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <p className="text-sm font-medium">No defenses scheduled yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Upcoming defense sessions will appear here once coordinators publish schedules.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.upcomingDefenses.map((item) => (
                    <div key={`${item.title}-${item.date}`} className="rounded-lg border p-3">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                      <p className="text-xs text-muted-foreground">{item.committee}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
