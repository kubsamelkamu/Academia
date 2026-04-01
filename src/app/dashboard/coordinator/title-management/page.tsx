"use client"

import React, { useMemo, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Send,
  XCircle,
  CheckCircle2,
  Eye,
  Download,
  ArrowLeft,
  Search,
  Filter,
  Clock,
  FileText,
  Users,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  BookOpen,
  GraduationCap,
  ClipboardList,
  BarChart3,
  SlidersHorizontal,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

/* ─── Types ───────────────────────────────────────────────────────────── */
type TitleStatus = "pending" | "approved" | "rejected"

interface ProjectTitle {
  id: string
  title: string
  description: string
  groupId: string
  groupName: string
  managerName: string
  memberCount: number
  domain: string
  submittedAt: string
  status: TitleStatus
  reviewNote?: string
}

/* ─── Mock Data (groups with up to 3 title proposals each) ───────────── */
const INITIAL_TITLES: ProjectTitle[] = [
  /* ── AI Research Group ── */
  { id: "t1a", title: "AI-Based Student Experience Analyzer",
    description: "A predictive student engagement system using NLP and behavior stream analysis to identify at-risk students early and improve retention outcomes through personalised interventions.",
    groupId: "g1", groupName: "AI Research Group", managerName: "Maria Garcia", memberCount: 4,
    domain: "Artificial Intelligence", submittedAt: "2025-03-10", status: "pending" },
  { id: "t1b", title: "Intelligent Tutoring System with Adaptive Learning",
    description: "An adaptive e-learning platform that tailors quiz difficulty and content recommendations to each student's learning pace using reinforcement learning and knowledge graphs.",
    groupId: "g1", groupName: "AI Research Group", managerName: "Maria Garcia", memberCount: 4,
    domain: "Artificial Intelligence", submittedAt: "2025-03-10", status: "pending" },
  { id: "t1c", title: "Multi-modal Sentiment Analysis for Student Feedback",
    description: "Combines text, voice tone, and facial expression signals to derive holistic sentiment scores from student course evaluations, enabling richer institutional insights.",
    groupId: "g1", groupName: "AI Research Group", managerName: "Maria Garcia", memberCount: 4,
    domain: "Artificial Intelligence", submittedAt: "2025-03-10", status: "rejected",
    reviewNote: "Out of scope for the current semester. Consider as a follow-up research track." },

  /* ── Data Analytics Team ── */
  { id: "t2a", title: "Campus Energy Monitoring Dashboard",
    description: "A real-time dashboard to visualise campus energy consumption patterns, identify inefficiencies, and recommend sustainable practices to drive campus-wide sustainability goals.",
    groupId: "g2", groupName: "Data Analytics Team", managerName: "Alice Brown", memberCount: 3,
    domain: "IoT & Sustainability", submittedAt: "2025-03-09", status: "approved",
    reviewNote: "Well-scoped proposal with clear deliverables. Forwarded to DC Committee." },
  { id: "t2b", title: "Predictive Maintenance System for Campus Infrastructure",
    description: "Uses time-series anomaly detection on sensor data from HVAC, elevators, and lighting systems to predict failure events and schedule preventive maintenance proactively.",
    groupId: "g2", groupName: "Data Analytics Team", managerName: "Alice Brown", memberCount: 3,
    domain: "IoT & Sustainability", submittedAt: "2025-03-09", status: "pending" },

  /* ── Security Systems ── */
  { id: "t3a", title: "Secure Research Discussion Portal",
    description: "A collaborative platform for research teams with role-based access controls, end-to-end encryption, and document versioning to protect sensitive research data.",
    groupId: "g3", groupName: "Security Systems", managerName: "Charlie Davis", memberCount: 5,
    domain: "Cybersecurity", submittedAt: "2025-03-08", status: "rejected",
    reviewNote: "Scope too broad for a single semester. Requested narrower focus." },
  { id: "t3b", title: "Zero-Trust Network Access Control System",
    description: "Implements a zero-trust security model for campus network access, replacing legacy VPN systems with per-application identity-based policies and continuous verification.",
    groupId: "g3", groupName: "Security Systems", managerName: "Charlie Davis", memberCount: 5,
    domain: "Cybersecurity", submittedAt: "2025-03-08", status: "pending" },
  { id: "t3c", title: "Biometric Authentication for Campus Resources",
    description: "Replaces card-based access with multi-factor biometric authentication (fingerprint + face) for labs, libraries, and exam halls using privacy-preserving on-device processing.",
    groupId: "g3", groupName: "Security Systems", managerName: "Charlie Davis", memberCount: 5,
    domain: "Cybersecurity", submittedAt: "2025-03-08", status: "pending" },

  /* ── Mobile Dev Team ── */
  { id: "t4a", title: "Smart Campus Navigation System",
    description: "An indoor navigation app with real-time crowd density mapping using BLE beacons and ML-based pathfinding algorithms to help students navigate large campus buildings efficiently.",
    groupId: "g4", groupName: "Mobile Dev Team", managerName: "Samuel Lee", memberCount: 4,
    domain: "Mobile & IoT", submittedAt: "2025-03-12", status: "pending" },
  { id: "t4b", title: "Campus Event Discovery & RSVP App",
    description: "A location-aware mobile app that aggregates departmental events, sends personalised recommendations via ML matching, and supports in-app RSVP with calendar sync.",
    groupId: "g4", groupName: "Mobile Dev Team", managerName: "Samuel Lee", memberCount: 4,
    domain: "Mobile & IoT", submittedAt: "2025-03-12", status: "pending" },

  /* ── Blockchain Innovators ── */
  { id: "t5a", title: "Blockchain-Based Academic Records System",
    description: "An immutable, tamper-proof ledger for storing and verifying student academic records, enabling instant third-party credential verification without institutional intermediaries.",
    groupId: "g5", groupName: "Blockchain Innovators", managerName: "Priya Patel", memberCount: 3,
    domain: "Blockchain", submittedAt: "2025-03-11", status: "pending" },
  { id: "t5b", title: "Decentralized Peer Review Platform",
    description: "A blockchain-based system where academic peer reviews are hashed on-chain, ensuring transparency, preventing bias, and rewarding quality reviewers with token incentives.",
    groupId: "g5", groupName: "Blockchain Innovators", managerName: "Priya Patel", memberCount: 3,
    domain: "Blockchain", submittedAt: "2025-03-11", status: "approved",
    reviewNote: "Innovative and well-researched. Approved with minor scope clarification needed." },

  /* ── AR/VR Lab ── */
  { id: "t6a", title: "AR-Assisted Laboratory Training Platform",
    description: "An augmented reality application that overlays step-by-step instructions and safety alerts during laboratory practicals, reducing errors and improving learning outcomes.",
    groupId: "g6", groupName: "AR/VR Lab", managerName: "James Kim", memberCount: 4,
    domain: "AR/VR", submittedAt: "2025-03-07", status: "approved",
    reviewNote: "Innovative use of AR in education. Strong technical plan." },
  { id: "t6b", title: "VR-Based Remote Campus Tour System",
    description: "An immersive 360° VR campus tour platform for prospective students and remote learners, featuring live guide integration, hotspot information panels, and Q&A sessions.",
    groupId: "g6", groupName: "AR/VR Lab", managerName: "James Kim", memberCount: 4,
    domain: "AR/VR", submittedAt: "2025-03-07", status: "pending" },
]

/* ─── Config ──────────────────────────────────────────────────────────── */
const STATUS_CFG = {
  pending:  { label: "Pending",  cls: "bg-primary/10 text-primary border-primary/20",               dot: "bg-primary" },
  approved: { label: "Approved", cls: "bg-muted text-foreground border-border",                     dot: "bg-foreground/50" },
  rejected: { label: "Rejected", cls: "bg-destructive/10 text-destructive border-destructive/20",   dot: "bg-destructive" },
}


/* ─── Helpers ─────────────────────────────────────────────────────────── */
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}
function daysAgo(s: string) {
  const d = Math.floor((Date.now() - new Date(s).getTime()) / 86400000)
  return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`
}

/* ─── Review Sheet ────────────────────────────────────────────────────── */
function ReviewSheet({
  title, open, onClose, onApprove, onReject, onSendToDC,
}: {
  title: ProjectTitle | null
  open: boolean
  onClose: () => void
  onApprove: (id: string, note: string) => void
  onReject: (id: string, reason: string) => void
  onSendToDC: (id: string) => void
}) {
  const [note, setNote]             = useState("")
  const [rejectMode, setRejectMode] = useState(false)
  const [saving, setSaving]         = useState(false)

  React.useEffect(() => { if (title) { setNote(""); setRejectMode(false) } }, [title?.id])

  if (!title) return null
  const sc = STATUS_CFG[title.status]

  const act = async (fn: () => void) => { setSaving(true); await new Promise(r => setTimeout(r, 600)); setSaving(false); fn(); onClose() }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0 gap-0">

        <SheetHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-sm leading-snug line-clamp-2">{title.title}</SheetTitle>
              <SheetDescription className="text-xs mt-0.5">{title.groupName} · {title.domain}</SheetDescription>
            </div>
            <Badge variant="outline" className={`shrink-0 text-xs ${sc.cls}`}>{sc.label}</Badge>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5">

          {/* Meta */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: "Group",     value: title.groupName },
              { label: "Manager",   value: title.managerName },
              { label: "Domain",    value: title.domain },
              { label: "Submitted", value: fmtDate(title.submittedAt) },
            ].map(row => (
              <div key={row.label} className="rounded-lg bg-muted/40 px-3 py-2 space-y-0.5">
                <p className="text-muted-foreground">{row.label}</p>
                <p className="font-semibold text-sm text-foreground">{row.value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> Description
            </p>
            <div className="rounded-xl border bg-muted/20 px-4 py-3">
              <p className="text-sm leading-relaxed">{title.description}</p>
            </div>
          </div>

          {/* Existing review note */}
          {title.reviewNote && (
            <div className={`rounded-xl border px-4 py-3 text-sm ${
              title.status === "rejected"
                ? "bg-destructive/5 border-destructive/20 text-destructive"
                : "bg-primary/5 border-primary/10 text-foreground"
            }`}>
              <span className="font-semibold">Coordinator note:</span> {title.reviewNote}
            </div>
          )}

          <Separator />

          {/* Actions */}
          {title.status === "pending" ? (
            rejectMode ? (
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Rejection Reason
                </p>
                <Textarea
                  placeholder="Explain why this title is being rejected…"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="resize-none text-sm min-h-[90px]"
                />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" disabled={saving}
                    onClick={() => { setRejectMode(false); setNote("") }}>Cancel</Button>
                  <Button variant="destructive" className="flex-1 gap-2" disabled={saving || !note.trim()}
                    onClick={() => act(() => onReject(title.id, note))}>
                    {saving ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Confirm Reject
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Coordinator Note (optional)
                </p>
                <Textarea
                  placeholder="Add feedback for the group or committee…"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="resize-none text-sm min-h-[70px]"
                />
                <div className="grid grid-cols-3 gap-2">
                  <Button className="gap-1.5 text-xs" disabled={saving}
                    onClick={() => act(() => onApprove(title.id, note))}>
                    {saving ? <div className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Approve
                  </Button>
                  <Button variant="outline" className="gap-1.5 text-xs hover:border-primary hover:text-primary" disabled={saving}
                    onClick={() => act(() => onSendToDC(title.id))}>
                    <Send className="h-3.5 w-3.5" /> Send DC
                  </Button>
                  <Button variant="outline" className="gap-1.5 text-xs hover:border-destructive hover:text-destructive" disabled={saving}
                    onClick={() => setRejectMode(true)}>
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              </div>
            )
          ) : (
            <div className={`rounded-xl border px-4 py-3 text-sm text-center ${
              title.status === "approved"
                ? "bg-primary/5 border-primary/10 text-foreground"
                : "bg-destructive/5 border-destructive/20 text-destructive"
            }`}>
              This title has been <span className="font-semibold">{title.status}</span> and requires no further action.
            </div>
          )}

        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ─── Title Row (inside group card) ──────────────────────────────────── */
function TitleRow({
  index,
  title,
  onReview,
}: {
  index: number
  title: ProjectTitle
  onReview: (t: ProjectTitle) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const sc = STATUS_CFG[title.status]

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      expanded ? "border-primary/20 bg-primary/[0.02]" : "border-border/60 bg-card hover:border-primary/15 hover:bg-muted/20"
    )}>
      {/* Row header */}
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Number badge */}
        <div className={cn(
          "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5",
          title.status === "pending"  ? "bg-primary/10 text-primary" :
          title.status === "approved" ? "bg-muted text-foreground" :
                                        "bg-destructive/10 text-destructive"
        )}>
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p className="font-medium text-sm leading-snug flex-1 min-w-0">{title.title}</p>
            <Badge variant="outline" className={`shrink-0 text-xs ${sc.cls}`}>{sc.label}</Badge>
          </div>

          {/* Date + note pills */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {daysAgo(title.submittedAt)}
            </span>
            {title.reviewNote && (
              <span className={cn(
                "flex items-center gap-1 text-xs rounded-full px-2 py-0.5",
                title.status === "rejected"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/5 text-primary/80"
              )}>
                <ClipboardList className="h-3 w-3" /> Note
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs hover:border-primary hover:text-primary"
            onClick={() => onReview(title)}
          >
            <Eye className="h-3.5 w-3.5" />
            {title.status === "pending" ? "Review" : "View"}
            </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setExpanded(v => !v)}
          >
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", expanded && "rotate-180")} />
          </Button>
        </div>
      </div>

      {/* Expandable detail */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/60 pt-3 ml-9">
          {/* Description */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</p>
            <p className="text-sm leading-relaxed text-foreground/90">{title.description}</p>
          </div>

          {/* Review note */}
          {title.reviewNote && (
            <div className={cn(
              "rounded-lg border px-3 py-2 text-xs",
              title.status === "rejected"
                ? "bg-destructive/5 border-destructive/10 text-destructive"
                : "bg-primary/5 border-primary/10 text-primary/80"
            )}>
              <span className="font-semibold">Coordinator note:</span> {title.reviewNote}
            </div>
          )}

          {/* Quick inline actions */}
          {title.status === "pending" && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={() => onReview(title)}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Review &amp; Approve
              </Button>
              <Button variant="outline" size="sm"
                className="h-7 gap-1.5 text-xs hover:border-destructive hover:text-destructive"
                onClick={() => onReview(title)}>
                <XCircle className="h-3.5 w-3.5" /> Review &amp; Reject
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Group Card ──────────────────────────────────────────────────────── */
function downloadGroupDoc(groupName: string, domain: string, managerName: string, titles: ProjectTitle[]) {
  const lines: string[] = [
    `PROJECT TITLE PROPOSALS`,
    `═══════════════════════════════════════════════════`,
    `Group:    ${groupName}`,
    `Manager:  ${managerName}`,
    `Domain:   ${domain}`,
    `Submitted: ${titles[0] ? fmtDate(titles[0].submittedAt) : "—"}`,
    `═══════════════════════════════════════════════════`,
    "",
  ]
  titles.forEach((t, i) => {
    lines.push(`Title ${i + 1}: ${t.title}`)
    lines.push(`Status:  ${t.status.charAt(0).toUpperCase() + t.status.slice(1)}`)
    lines.push(``)
    lines.push(`Description:`)
    lines.push(`  ${t.description}`)
    if (t.reviewNote) {
      lines.push(``)
      lines.push(`Coordinator Note:`)
      lines.push(`  ${t.reviewNote}`)
    }
    lines.push(``)
    lines.push(`───────────────────────────────────────────────────`)
    lines.push(``)
  })

  const content = lines.join("\n")
  const blob    = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url     = URL.createObjectURL(blob)
  const a       = document.createElement("a")
  a.href        = url
  a.download    = `${groupName.replace(/\s+/g, "_")}_Title_Proposals.txt`
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}

function GroupCard({
  groupId,
  groupName,
  managerName,
  memberCount,
  domain,
  titles,
  onReview,
}: {
  groupId: string
  groupName: string
  managerName: string
  memberCount: number
  domain: string
  titles: ProjectTitle[]
  onReview: (t: ProjectTitle) => void
}) {
  const pending  = titles.filter(t => t.status === "pending").length
  const approved = titles.filter(t => t.status === "approved").length
  const rejected = titles.filter(t => t.status === "rejected").length

  return (
    <Card className="border-none shadow-sm overflow-hidden">
      {/* Group header */}
      <div className="flex items-start gap-4 px-5 py-4 bg-muted/30 border-b">
        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>

        {/* Group info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm">{groupName}</h3>
            {pending > 0 && (
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                {pending} pending
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {memberCount} members · {managerName}</span>
            <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {domain}</span>
          </div>
        </div>

        {/* Right side: summary pills + download button */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Status summary */}
          <div className="flex gap-1 flex-wrap justify-end">
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {titles.length} proposal{titles.length !== 1 ? "s" : ""}
            </span>
            {approved > 0 && (
              <span className="rounded-full bg-muted text-foreground/70 px-2 py-0.5 text-[10px]">
                {approved} approved
              </span>
            )}
            {rejected > 0 && (
              <span className="rounded-full bg-destructive/10 text-destructive px-2 py-0.5 text-[10px]">
                {rejected} rejected
              </span>
            )}
          </div>

          {/* Combined document download */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs hover:border-primary hover:text-primary"
            onClick={() => {
              downloadGroupDoc(groupName, domain, managerName, titles)
              toast.success("Document downloaded", {
                description: `All ${titles.length} title proposals for ${groupName}`,
              })
            }}
          >
            <Download className="h-3.5 w-3.5" />
            All Proposals
          </Button>
            </div>
            </div>

      {/* Titles list */}
      <div className="p-4 space-y-2.5">
        {titles.map((t, i) => (
          <TitleRow key={t.id} index={i} title={t} onReview={onReview} />
        ))}
                </div>
    </Card>
  )
}

/* ─── Workflow Pipeline ───────────────────────────────────────────────── */
function WorkflowPipeline({ titles }: { titles: ProjectTitle[] }) {
  const pending  = titles.filter(t => t.status === "pending").length
  const approved = titles.filter(t => t.status === "approved").length
  const rejected = titles.filter(t => t.status === "rejected").length

  const steps = [
    { label: "Submitted",          value: titles.length,  sub: "total",           icon: GraduationCap, active: true },
    { label: "Coordinator Review", value: pending,        sub: "awaiting action",  icon: ClipboardList, active: pending > 0 },
    { label: "DC Committee",       value: approved,       sub: "forwarded",        icon: Users,         active: approved > 0 },
    { label: "Final Decision",     value: approved,       sub: "approved",         icon: CheckCircle2,  active: approved > 0 },
  ]

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-0 overflow-x-auto">
          {steps.map((s, i) => (
            <React.Fragment key={s.label}>
              <div className={cn("flex flex-col items-center text-center min-w-[90px] flex-1", !s.active && "opacity-40")}>
                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center mb-1.5", s.active ? "bg-primary/10" : "bg-muted")}>
                  <s.icon className={cn("h-5 w-5", s.active ? "text-primary" : "text-muted-foreground")} />
                </div>
                <p className={cn("text-xl font-bold", s.active ? "text-primary" : "text-muted-foreground")}>{s.value}</p>
                <p className="text-xs font-medium mt-0.5 leading-tight">{s.label}</p>
                <p className="text-[10px] text-muted-foreground">{s.sub}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="flex items-center mt-4 px-0.5 shrink-0">
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        {rejected > 0 && (
          <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-destructive">
            <XCircle className="h-3.5 w-3.5" /> {rejected} title{rejected !== 1 ? "s" : ""} rejected — groups notified
          </div>
        )}
          </CardContent>
        </Card>
  )
}

/* ─── Bulk Approve Dialog ─────────────────────────────────────────────── */
function BulkApproveDialog({ open, count, onClose, onConfirm }: {
  open: boolean; count: number; onClose: () => void; onConfirm: () => void
}) {
  const [note, setNote]   = useState("")
  const [saving, setSaving] = useState(false)

  const handle = async () => {
    setSaving(true); await new Promise(r => setTimeout(r, 700)); setSaving(false)
    onConfirm(); setNote(""); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
            <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" /> Approve All Pending
          </DialogTitle>
              <DialogDescription>
            {count} pending title{count !== 1 ? "s" : ""} will be approved and forwarded to DC Committee.
              </DialogDescription>
            </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <Label className="text-sm">Coordinator Note (optional)</Label>
            <Textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Add a general note for the committee…"
              className="resize-none text-sm min-h-[80px]" />
                </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button className="flex-1 gap-2" onClick={handle} disabled={saving}>
              {saving ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Approve All
            </Button>
                </div>
                  </div>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Page ────────────────────────────────────────────────────────────── */
export default function CoordinatorTitleManagementPage() {
  const [titles, setTitles]           = useState<ProjectTitle[]>(INITIAL_TITLES)
  const [sheetTitle, setSheetTitle]   = useState<ProjectTitle | null>(null)
  const [sheetOpen, setSheetOpen]     = useState(false)
  const [bulkOpen, setBulkOpen]       = useState(false)
  const [search, setSearch]           = useState("")
  const [statusFilter, setStatusFilter] = useState<TitleStatus | "all">("all")
  const [domainFilter, setDomainFilter] = useState("all")

  /* Derived */
  const pending  = titles.filter(t => t.status === "pending")
  const approved = titles.filter(t => t.status === "approved")
  const rejected = titles.filter(t => t.status === "rejected")

  const domains = useMemo(() => Array.from(new Set(titles.map(t => t.domain))), [titles])

  /* Groups (after applying filters) */
  const filteredTitles = useMemo(() => {
    return titles.filter(t => {
      const q = search.toLowerCase()
      const matchSearch = !search ||
        t.title.toLowerCase().includes(q) ||
        t.groupName.toLowerCase().includes(q) ||
        t.managerName.toLowerCase().includes(q) ||
        t.domain.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      const matchStatus = statusFilter === "all" || t.status === statusFilter
      const matchDomain = domainFilter === "all" || t.domain === domainFilter
      return matchSearch && matchStatus && matchDomain
    })
  }, [titles, search, statusFilter, domainFilter])

  /* Build unique groups from filtered titles */
  const groups = useMemo(() => {
    const map = new Map<string, { groupId: string; groupName: string; managerName: string; memberCount: number; domain: string; titles: ProjectTitle[] }>()
    filteredTitles.forEach(t => {
      if (!map.has(t.groupId)) {
        map.set(t.groupId, { groupId: t.groupId, groupName: t.groupName, managerName: t.managerName, memberCount: t.memberCount, domain: t.domain, titles: [] })
      }
      map.get(t.groupId)!.titles.push(t)
    })
    return Array.from(map.values())
  }, [filteredTitles])

  /* Actions */
  const openSheet = (t: ProjectTitle) => { setSheetTitle(t); setSheetOpen(true) }

  const handleApprove = (id: string, note: string) => {
    setTitles(prev => prev.map(t => t.id === id ? { ...t, status: "approved", reviewNote: note || "Approved at coordinator level." } : t))
    toast.success("Title Approved", { description: "Forwarded to DC Committee for final review." })
  }

  const handleReject = (id: string, reason: string) => {
    setTitles(prev => prev.map(t => t.id === id ? { ...t, status: "rejected", reviewNote: reason } : t))
    toast.error("Title Rejected", { description: "The group has been notified." })
  }

  const handleSendToDC = (id: string) => {
    const t = titles.find(x => x.id === id)
    setTitles(prev => prev.map(x => x.id === id ? { ...x, status: "approved", reviewNote: "Validated and forwarded to DC Committee." } : x))
    toast.success("Sent to DC Committee", { description: `"${t?.title}" is now under committee review.` })
  }

  const handleBulkApprove = () => {
    setTitles(prev => prev.map(t =>
      t.status === "pending" ? { ...t, status: "approved", reviewNote: "Bulk approved and forwarded to DC Committee." } : t
    ))
    toast.success("All Pending Titles Approved", { description: `${pending.length} title${pending.length !== 1 ? "s" : ""} forwarded to DC Committee.` })
  }

  const kpi = [
    { label: "Total Proposals",  value: titles.length,   icon: FileText,    bg: "bg-primary/10",  color: "text-primary" },
    { label: "Pending Review",   value: pending.length,  icon: Clock,       bg: pending.length  > 0 ? "bg-destructive/10" : "bg-muted", color: pending.length  > 0 ? "text-destructive" : "text-muted-foreground" },
    { label: "Approved",         value: approved.length, icon: CheckCircle2,bg: "bg-muted",       color: "text-foreground" },
    { label: "Rejected",         value: rejected.length, icon: XCircle,     bg: rejected.length > 0 ? "bg-destructive/10" : "bg-muted", color: rejected.length > 0 ? "text-destructive" : "text-muted-foreground" },
  ]

  return (
    <div className="space-y-6 pb-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/coordinator">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
                  <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Title Management
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review project title proposals submitted by each student group
            </p>
                  </div>
                </div>
        <div className="flex items-center gap-2 pl-11 sm:pl-0 flex-wrap">
          {pending.length > 0 && (
            <>
              <Badge variant="destructive" className="gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> {pending.length} pending
              </Badge>
              <Button size="sm" className="gap-1.5" onClick={() => setBulkOpen(true)}>
                <CheckCircle2 className="h-4 w-4" /> Approve All Pending
                  </Button>
                </>
              )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpi.map(s => (
          <Card key={s.label} className="group border-none shadow-sm transition-all hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`h-11 w-11 rounded-full ${s.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
            </div>

      {/* Pipeline */}
      <WorkflowPipeline titles={titles} />

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title, group, manager, domain, or description…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as TitleStatus | "all")}>
          <SelectTrigger className="h-10 w-44 shrink-0">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={domainFilter} onValueChange={setDomainFilter}>
          <SelectTrigger className="h-10 w-44 shrink-0">
            <BarChart3 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            {domains.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        {(search || statusFilter !== "all" || domainFilter !== "all") && (
          <Button variant="ghost" size="sm" className="h-10 text-xs shrink-0"
            onClick={() => { setSearch(""); setStatusFilter("all"); setDomainFilter("all") }}>
            Clear
              </Button>
        )}
      </div>

      {(search || statusFilter !== "all" || domainFilter !== "all") && (
        <p className="text-sm text-muted-foreground -mt-2">
          {groups.length} group{groups.length !== 1 ? "s" : ""} · {filteredTitles.length} title{filteredTitles.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Group cards */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed text-center">
          <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="font-medium text-muted-foreground">No titles match your filters</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting the search or filter criteria</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(g => (
            <GroupCard
              key={g.groupId}
              {...g}
              onReview={openSheet}
            />
          ))}
        </div>
      )}

      {/* Domain breakdown */}
      {groups.length > 0 && (
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-primary" /> Proposals by Domain
            </p>
            {domains.map(d => {
              const count = titles.filter(t => t.domain === d).length
              const pct   = Math.round((count / titles.length) * 100)
              return (
                <div key={d} className="flex items-center gap-3">
                  <span className="text-sm w-44 truncate text-muted-foreground">{d}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-primary w-5 text-right">{count}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Review Sheet */}
      <ReviewSheet
        title={sheetTitle}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
        onSendToDC={handleSendToDC}
      />

      {/* Bulk Approve */}
      <BulkApproveDialog
        open={bulkOpen}
        count={pending.length}
        onClose={() => setBulkOpen(false)}
        onConfirm={handleBulkApprove}
      />
    </div>
  )
}
