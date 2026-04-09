"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, CheckCircle2, XCircle, Send, FileText, Users, Clock, BookOpen } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

type TitleStatus = "pending" | "approved" | "rejected"

const TITLES = [
  {
    id: "t1",
    title: "AI-Based Student Experience Analyzer",
    description: "A predictive student engagement system using NLP and behavior stream analysis to identify at-risk students early and improve retention outcomes through personalised interventions.",
    groupId: "g1",
    groupName: "AI Research Group",
    managerName: "Maria Garcia",
    domain: "Artificial Intelligence",
    submittedAt: "2025-03-10",
    status: "pending" as TitleStatus,
  },
  {
    id: "t2",
    title: "Campus Energy Monitoring Dashboard",
    description: "A real-time dashboard to visualise campus energy consumption patterns and drive sustainability.",
    groupId: "g2",
    groupName: "Data Analytics Team",
    managerName: "Alice Brown",
    domain: "IoT & Sustainability",
    submittedAt: "2025-03-09",
    status: "approved" as TitleStatus,
    reviewNote: "Well-scoped proposal with clear deliverables. Forwarded to DC Committee.",
  },
  {
    id: "t3",
    title: "Secure Research Discussion Portal",
    description: "A collaborative platform for research teams with role-based access controls and document versioning.",
    groupId: "g3",
    groupName: "Security Systems",
    managerName: "Charlie Davis",
    domain: "Cybersecurity",
    submittedAt: "2025-03-08",
    status: "rejected" as TitleStatus,
    reviewNote: "Scope is too broad for a single-semester project. Requested revision.",
  },
]

const STATUS_CFG = {
  pending:  { label: "Pending",  cls: "bg-primary/10 text-primary border-primary/20" },
  approved: { label: "Approved", cls: "bg-muted text-foreground border-border" },
  rejected: { label: "Rejected", cls: "bg-destructive/10 text-destructive border-destructive/20" },
}

export default function TitleDetailPage() {
  const params   = useParams()
  const titleId  = params.id as string
  const found    = TITLES.find(t => t.id === titleId)

  const [status, setStatus]       = useState<TitleStatus>(found?.status ?? "pending")
  const [rejectMode, setRejectMode] = useState(false)
  const [note, setNote]           = useState("")
  const [saving, setSaving]       = useState(false)

  if (!found) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-lg font-semibold text-muted-foreground">Title not found</p>
        <Link href="/dashboard/coordinator/title-management">
          <Button variant="outline" className="mt-4 gap-2"><ArrowLeft className="h-4 w-4" /> Back to list</Button>
        </Link>
      </div>
    )
  }

  const sc = STATUS_CFG[status]

  const handleApprove = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false)
    setStatus("approved")
    toast.success("Title Approved", { description: "Forwarded to DC Committee." })
  }

  const handleReject = async () => {
    if (!note.trim()) { toast.error("Please provide a rejection reason"); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false)
    setStatus("rejected")
    toast.error("Title Rejected", { description: "The group has been notified." })
    setRejectMode(false)
  }

  const handleSendToDC = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false)
    setStatus("approved")
    toast.success("Sent to DC Committee", { description: `${found.groupName} Project Titles are now under committee review.` })
  }

  return (
    <div className="space-y-6 pb-8 animate-fade-in max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/coordinator/title-management">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Title Review
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Review and take action on this project title proposal</p>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base leading-snug">{`${found.groupName} Project Titles`}</CardTitle>
                <CardDescription className="mt-0.5">{found.domain}</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className={`shrink-0 text-xs ${sc.cls}`}>{sc.label}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: "Group",     value: found.groupName,    icon: Users },
              { label: "Manager",   value: found.managerName,  icon: Users },
              { label: "Domain",    value: found.domain,       icon: BookOpen },
              { label: "Submitted", value: new Date(found.submittedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }), icon: Clock },
            ].map(row => (
              <div key={row.label} className="rounded-lg bg-muted/40 px-3 py-2 space-y-0.5">
                <p className="text-muted-foreground">{row.label}</p>
                <p className="font-semibold text-sm text-foreground">{row.value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
            <div className="rounded-xl border bg-muted/20 px-4 py-3">
              <p className="text-sm leading-relaxed">{found.description}</p>
            </div>
          </div>

          {/* Existing note */}
          {found.reviewNote && (
            <div className={`rounded-xl border px-4 py-3 text-sm ${
              found.status === "rejected"
                ? "bg-destructive/5 border-destructive/20 text-destructive"
                : "bg-primary/5 border-primary/10 text-foreground"
            }`}>
              <span className="font-semibold">Coordinator note:</span> {found.reviewNote}
            </div>
          )}

          <Separator />

          {/* Actions */}
          {status === "pending" ? (
            rejectMode ? (
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rejection Reason</p>
                <Textarea
                  placeholder="Explain why this title is being rejected…"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="resize-none text-sm min-h-[90px]"
                />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setRejectMode(false); setNote("") }} disabled={saving}>Cancel</Button>
                  <Button variant="destructive" className="flex-1 gap-2" disabled={saving || !note.trim()} onClick={handleReject}>
                    {saving
                      ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      : <XCircle className="h-4 w-4" />
                    }
                    Confirm Reject
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <Button className="gap-1.5" disabled={saving} onClick={handleApprove}>
                  {saving
                    ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    : <CheckCircle2 className="h-4 w-4" />
                  }
                  Approve
                </Button>
                <Button variant="outline" className="gap-1.5 hover:border-primary hover:text-primary" disabled={saving} onClick={handleSendToDC}>
                  <Send className="h-4 w-4" /> Send to DC
                </Button>
                <Button variant="outline" className="gap-1.5 hover:border-destructive hover:text-destructive" disabled={saving} onClick={() => setRejectMode(true)}>
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
              </div>
            )
          ) : (
            <div className={`rounded-xl border px-4 py-3 text-sm text-center ${
              status === "approved"
                ? "bg-primary/5 border-primary/10 text-foreground"
                : "bg-destructive/5 border-destructive/20 text-destructive"
            }`}>
              This title has been <span className="font-semibold">{status}</span>.
            </div>
          )}

          <Link href="/dashboard/coordinator/title-management">
            <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Title Management
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
