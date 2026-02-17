import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle2, UserCheck, Users } from "lucide-react"

const assignmentQueue = [
  {
    coordinator: "Dr. Sarah Ahmed",
    department: "Computer Science",
    request: "Approve reassignment to senior projects",
    priority: "High",
    waitingTime: "2d",
  },
  {
    coordinator: "Prof. Youssef Kareem",
    department: "Information Systems",
    request: "Add coordinator seat for capstone batch",
    priority: "Medium",
    waitingTime: "1d",
  },
  {
    coordinator: "Dr. Lina Omar",
    department: "Software Engineering",
    request: "Update advisory scope and load limit",
    priority: "Low",
    waitingTime: "8h",
  },
]

const workloadByDepartment = [
  { name: "Computer Science", active: 5, capacity: 6, blocked: 0 },
  { name: "Software Engineering", active: 4, capacity: 5, blocked: 1 },
  { name: "Information Systems", active: 3, capacity: 4, blocked: 1 },
]

const escalations = [
  "Two coordinator approvals are approaching SLA limit.",
  "Software Engineering needs one backup coordinator for defense week.",
]

export default function CoordinatorsPage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Coordinators"
        description="Review coordinator assignments, capacity, and pending escalations."
        badge="Department Head"
      />

      <DashboardKpiGrid
        items={[
          { title: "Total Coordinators", value: "18", note: "Across all departments", icon: Users },
          { title: "Assigned", value: "15", note: "Currently mapped to active tracks", icon: UserCheck },
          { title: "Unblocked", value: "13", note: "No pending blockers", icon: CheckCircle2 },
          { title: "Escalations", value: "2", note: "Require immediate review", icon: AlertTriangle },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <DashboardSectionCard
          className="xl:col-span-2"
          title="Assignment Queue"
          description="Priority requests waiting for Department Head decisions."
        >
          <div className="space-y-3">
            {assignmentQueue.map((item) => (
              <div key={item.coordinator} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{item.coordinator}</p>
                  <Badge variant={item.priority === "High" ? "destructive" : "secondary"}>{item.priority}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.department}</p>
                <p className="mt-2 text-sm">{item.request}</p>
                <p className="mt-1 text-xs text-muted-foreground">Waiting {item.waitingTime}</p>
              </div>
            ))}
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Workload Balance"
          description="Coordinator coverage and blocking status by department."
        >
          <div className="space-y-3">
            {workloadByDepartment.map((row) => (
              <div key={row.name} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{row.name}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">Active {row.active}</Badge>
                  <Badge variant="outline">Capacity {row.capacity}</Badge>
                  <Badge variant={row.blocked > 0 ? "destructive" : "secondary"}>Blocked {row.blocked}</Badge>
                </div>
              </div>
            ))}
          </div>
        </DashboardSectionCard>
      </div>

      <DashboardSectionCard
        title="Escalation Feed"
        description="Items needing leadership attention within this week."
      >
        <div className="space-y-2">
          {escalations.map((item) => (
            <div key={item} className="rounded-lg border p-3 text-sm">
              {item}
            </div>
          ))}
        </div>
        </DashboardSectionCard>

    </div>
  )
}
