"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Eye,
  Filter,
  Search,
  Shield,
  ShieldAlert,
  UserCog,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type AuditType = "role" | "invitation" | "report" | "approval" | "document"
type AuditSeverity = "info" | "warning" | "success"

interface AuditEvent {
  id: string
  actor: string
  action: string
  target: string
  type: AuditType
  severity: AuditSeverity
  timestamp: string
  details: string
}

const AUDIT_EVENTS: AuditEvent[] = [
  {
    id: "a1",
    actor: "Dr. Sarah Chen",
    action: "Assigned coordinator role",
    target: "Michael Brown",
    type: "role",
    severity: "success",
    timestamp: "2026-04-01T08:45:00Z",
    details: "Coordinator access granted for senior project management this semester.",
  },
  {
    id: "a2",
    actor: "Dr. Sarah Chen",
    action: "Sent invitation batch",
    target: "12 students",
    type: "invitation",
    severity: "info",
    timestamp: "2026-03-31T14:20:00Z",
    details: "Bulk invitation wave triggered from department invitation center.",
  },
  {
    id: "a3",
    actor: "Coordinator",
    action: "Published report package",
    target: "Q1 progress report",
    type: "report",
    severity: "success",
    timestamp: "2026-03-30T10:05:00Z",
    details: "Report exported and shared with department leadership.",
  },
  {
    id: "a4",
    actor: "Advisor",
    action: "Requested document revision",
    target: "API Documentation.docx",
    type: "document",
    severity: "warning",
    timestamp: "2026-03-29T16:10:00Z",
    details: "Revision requested due to missing exception handling notes and deployment appendix.",
  },
  {
    id: "a5",
    actor: "Department Head",
    action: "Approved grading release",
    target: "Capstone II results",
    type: "approval",
    severity: "success",
    timestamp: "2026-03-28T09:30:00Z",
    details: "Final grades were approved for publication after coordinator review.",
  },
]

const severityClass: Record<AuditSeverity, string> = {
  info: "bg-primary/10 text-primary border-primary/20",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  success: "bg-emerald-100 text-emerald-800 border-emerald-200",
}

export default function DepartmentHeadAuditLogsPage() {
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<AuditType | "all">("all")

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return AUDIT_EVENTS.filter((event) => {
      const matchesQuery =
        !needle ||
        event.actor.toLowerCase().includes(needle) ||
        event.action.toLowerCase().includes(needle) ||
        event.target.toLowerCase().includes(needle)

      const matchesType = typeFilter === "all" || event.type === typeFilter
      return matchesQuery && matchesType
    })
  }, [query, typeFilter])

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/department-head">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Audit Logs
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track visible admin actions, approvals, invitations, and reporting activity
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pl-11 sm:pl-0">
          <Badge variant="outline" className="gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" /> {filtered.length} events
          </Badge>
          <Badge className="gap-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            <Shield className="h-3.5 w-3.5" /> Transparency view
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {[
          { label: "Role Changes", value: AUDIT_EVENTS.filter((e) => e.type === "role").length, icon: UserCog },
          { label: "Invitations", value: AUDIT_EVENTS.filter((e) => e.type === "invitation").length, icon: Users },
          { label: "Approvals", value: AUDIT_EVENTS.filter((e) => e.type === "approval").length, icon: CheckCircle2 },
          { label: "Warnings", value: AUDIT_EVENTS.filter((e) => e.severity === "warning").length, icon: ShieldAlert },
        ].map((item) => (
          <Card key={item.label} className="border-none shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search actor, action, or target..." className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as AuditType | "all")}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="role">Role</SelectItem>
                <SelectItem value="invitation">Invitation</SelectItem>
                <SelectItem value="report">Report</SelectItem>
                <SelectItem value="approval">Approval</SelectItem>
                <SelectItem value="document">Document</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Activity Timeline</CardTitle>
            <CardDescription>Frontend audit trail for the department leadership workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filtered.map((event) => (
              <div key={event.id} className="rounded-xl border bg-muted/20 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{event.action}</p>
                      <Badge variant="outline" className={severityClass[event.severity]}>
                        {event.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.actor} → {event.target}</p>
                    <p className="text-sm">{event.details}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p className="flex items-center justify-end gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                    <p className="mt-1 uppercase tracking-wide">{event.type}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-base">Audit Notes</CardTitle>
            <CardDescription>Suggested UI checks for admin transparency.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              "Track invitations, role changes, approvals, and document escalations.",
              "Show severity badges so risky actions stand out quickly.",
              "Expose timestamps and actors for accountability during reviews.",
              "Keep this timeline accessible from both admin and coordinator oversight flows.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 rounded-lg bg-muted/20 px-3 py-2">
                <Eye className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
