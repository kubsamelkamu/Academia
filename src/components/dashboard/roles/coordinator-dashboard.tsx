"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCoordinatorDashboard } from "@/lib/hooks/use-coordinator-dashboard"
import { CoordinatorKpi } from "@/types/dashboard"
import {
  Calendar,
  ClipboardList,
  FileClock,
  FolderKanban,
  GraduationCap,
  type LucideIcon,
} from "lucide-react"
import { DashboardKpiSkeleton, DashboardSectionsSkeleton } from "./shared-skeletons"

const coordinatorKpiIcons: Record<CoordinatorKpi["icon"], LucideIcon> = {
  folderKanban: FolderKanban,
  graduationCap: GraduationCap,
  calendar: Calendar,
  clipboardList: ClipboardList,
}

export function CoordinatorDashboard() {
  const { data, isLoading } = useCoordinatorDashboard()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Coordinator Dashboard</h1>
        <p className="text-muted-foreground">
          Manage projects, advisor assignments, and defense readiness in your department.
        </p>
      </div>

      {isLoading ? (
        <DashboardKpiSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data?.kpis.map((card) => {
            const Icon = coordinatorKpiIcons[card.icon]

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
                  Priority Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!data || data.pendingQueue.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No high-priority items right now.</p>
                ) : (
                  <div className="space-y-3">
                    {data.pendingQueue.map((item) => (
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
                <CardTitle>Execution Focus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-medium">Advisor Allocation</p>
                    <p className="mt-1 text-xs text-muted-foreground">7 projects need advisor balancing</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-medium">Evaluation Follow-ups</p>
                    <p className="mt-1 text-xs text-muted-foreground">4 pending committee submissions</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-medium">Schedule Conflicts</p>
                    <p className="mt-1 text-xs text-muted-foreground">2 defense conflicts unresolved</p>
                  </div>
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
                  <p className="text-sm font-medium">No upcoming defenses</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Scheduled defense sessions will appear here once published.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.upcomingDefenses.map((item) => (
                    <div key={`${item.team}-${item.date}`} className="rounded-lg border p-3">
                      <p className="text-sm font-medium">{item.team}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                      <p className="text-xs text-muted-foreground">{item.room}</p>
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
