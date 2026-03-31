"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Upload,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  useAllTenantInvitationsList,
  useBulkInviteJob,
  useBulkInviteStudentsAsyncJob,
  useBulkInviteStudentsSync,
  useCreateTenantInvitation,
  usePreviewInvitationEmail,
  useResendTenantInvitation,
  useRevokeTenantInvitation,
  useTenantInvitationsList,
} from "@/lib/hooks/use-invitations"
import type {
  BulkInviteStudentItemDto,
  BulkInviteSyncResult,
  InvitationStatus,
  PreviewInvitationEmailResult,
  TenantInvitation,
} from "@/types/invitations"
import { createInvitationSchema, type CreateInvitationFormData } from "@/validations/invitations"
import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = "ALL" | InvitationStatus

type BulkInviteRow = { email: string; firstName: string; lastName: string }

type ImportedInvalidRow = { rowNumber: number; reason: string }

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatIsoToLocal(iso: string | null | undefined): string {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

function isLikelyEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function getCellValue(row: Record<string, unknown>, normalizedKey: string): string {
  const match = Object.keys(row).find((k) => k.trim().toLowerCase() === normalizedKey)
  const value = match ? row[match] : undefined
  if (typeof value === "string") return value
  if (value === null || value === undefined) return ""
  return String(value)
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

async function downloadBulkInviteTemplateXlsx() {
  const XLSX = await import("xlsx")
  const rows = Array.from({ length: 50 }, () => ({ email: "", firstName: "", lastName: "" }))
  const sheet = XLSX.utils.json_to_sheet(rows, { header: ["email", "firstName", "lastName"], skipHeader: false })
  sheet["!cols"] = [{ wch: 34 }, { wch: 18 }, { wch: 18 }]
  const infoSheet = XLSX.utils.aoa_to_sheet([
    ["Bulk Invite Template (Students)"],
    [""],
    ["What to fill"],
    ["- Sheet: INVITES"],
    ["- Columns (required): email, firstName, lastName"],
    ["- Max: 50 rows per upload"],
    [""],
    ["Tips"],
    ["- Leave unused rows blank"],
    ["- Keep the header names unchanged"],
    ["- Example:", "student1@university.edu", "Abebe", "Kebede"],
  ])
  infoSheet["!cols"] = [{ wch: 38 }, { wch: 28 }, { wch: 18 }, { wch: 18 }]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, "INVITES")
  XLSX.utils.book_append_sheet(workbook, infoSheet, "INFO")
  XLSX.writeFile(workbook, "bulk-invite-students-template.xlsx")
}

function uniqueInvitesByEmail(invites: BulkInviteStudentItemDto[]): BulkInviteStudentItemDto[] {
  const seen = new Set<string>()
  return invites.filter(({ email }) => {
    const key = email.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function isPending(invite: TenantInvitation): boolean {
  return invite.status === "PENDING" && !invite.revokedAt && !invite.acceptedAt
}

const STATUS_CONFIG: Record<InvitationStatus, { label: string; className: string; icon: React.ReactNode }> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800",
    icon: <Mail className="h-3 w-3" />,
  },
  ACCEPTED: {
    label: "Accepted",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-gray-500/10 text-gray-500 border-gray-200 dark:border-gray-700",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  REVOKED: {
    label: "Revoked",
    className: "bg-red-500/10 text-red-600 border-red-200 dark:border-red-800",
    icon: <XCircle className="h-3 w-3" />,
  },
}

// ── Email Preview ─────────────────────────────────────────────────────────────

function InvitationEmailPreview({ preview }: { preview: PreviewInvitationEmailResult }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm font-semibold">Subject: {preview.subject}</p>
          <Badge variant="outline" className="text-xs">Expires: {formatIsoToLocal(preview.expiresAt)}</Badge>
        </div>
        <div className="flex gap-4">
          <a className="text-sm text-primary hover:underline" href={preview.acceptUrl} target="_blank" rel="noreferrer">
            Accept invitation →
          </a>
          <a className="text-sm text-primary hover:underline" href={preview.loginUrl} target="_blank" rel="noreferrer">
            Login →
          </a>
        </div>
      </div>
      <Tabs defaultValue="html">
        <TabsList className="bg-muted/50 p-1 h-auto gap-1">
          <TabsTrigger value="html" className="rounded-lg px-4 py-1.5 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">HTML</TabsTrigger>
          <TabsTrigger value="text" className="rounded-lg px-4 py-1.5 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">Plain text</TabsTrigger>
        </TabsList>
        <TabsContent value="html">
          <div className="rounded-xl border bg-background overflow-hidden mt-2">
            <iframe
              title="Invitation email preview"
              sandbox="allow-popups allow-top-navigation-by-user-activation"
              srcDoc={preview.htmlContent}
              className="h-[60vh] min-h-[400px] w-full"
            />
          </div>
        </TabsContent>
        <TabsContent value="text">
          <div className="rounded-xl border bg-muted/40 p-4 mt-2">
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{preview.textContent}</pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function DepartmentHeadInvitationsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING")
  const [page, setPage] = useState(1)
  const [bulkInvites, setBulkInvites] = useState<BulkInviteRow[]>([{ email: "", firstName: "", lastName: "" }])
  const [bulkSubject, setBulkSubject] = useState("")
  const [bulkMessage, setBulkMessage] = useState("")
  const [bulkPreviewFirstName, setBulkPreviewFirstName] = useState("")
  const [bulkPreviewLastName, setBulkPreviewLastName] = useState("")
  const [importFileName, setImportFileName] = useState<string | null>(null)
  const [importValidInvites, setImportValidInvites] = useState<BulkInviteStudentItemDto[]>([])
  const [importInvalidRows, setImportInvalidRows] = useState<ImportedInvalidRow[]>([])
  const [importIsSending, setImportIsSending] = useState(false)
  const [latestBulkResult, setLatestBulkResult] = useState<BulkInviteSyncResult | null>(null)
  const [bulkJobId, setBulkJobId] = useState<string | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewModalData, setPreviewModalData] = useState<PreviewInvitationEmailResult | null>(null)

  const isAllStatuses = statusFilter === "ALL"
  const pageSize = 10

  const listParams = useMemo(() => (statusFilter === "ALL" ? null : { status: statusFilter }), [statusFilter])

  const invitationsByStatusQuery = useTenantInvitationsList(listParams ?? {}, { enabled: !isAllStatuses })
  const invitationsAllQuery = useAllTenantInvitationsList({ enabled: isAllStatuses })
  const invitationsQuery = isAllStatuses ? invitationsAllQuery : invitationsByStatusQuery

  const invitations = useMemo(() => invitationsQuery.data ?? [], [invitationsQuery.data])
  const totalInvitations = invitations.length
  const totalPages = Math.max(1, Math.ceil(totalInvitations / pageSize))
  const effectivePage = Math.min(page, totalPages)
  const pageStartIndex = (effectivePage - 1) * pageSize
  const pageEndIndexExclusive = Math.min(pageStartIndex + pageSize, totalInvitations)
  const pagedInvitations = useMemo(
    () => invitations.slice(pageStartIndex, pageEndIndexExclusive),
    [invitations, pageEndIndexExclusive, pageStartIndex]
  )

  const createInvitationMutation = useCreateTenantInvitation()
  const bulkSyncMutation = useBulkInviteStudentsSync()
  const bulkAsyncMutation = useBulkInviteStudentsAsyncJob()
  const previewSingleMutation = usePreviewInvitationEmail()
  const previewBulkMutation = usePreviewInvitationEmail()
  const resendMutation = useResendTenantInvitation()
  const revokeMutation = useRevokeTenantInvitation()

  const bulkJobQuery = useBulkInviteJob(bulkJobId, {
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return 1500
      return data.state === "completed" || data.state === "failed" ? false : 1500
    },
  })

  const lastBulkJobToastKeyRef = useRef<string | null>(null)

  useEffect(() => {
    const state = bulkJobQuery.data?.state
    if (!state || (state !== "completed" && state !== "failed")) return
    const toastKey = `${bulkJobId ?? ""}:${state}`
    if (lastBulkJobToastKeyRef.current !== toastKey) {
      lastBulkJobToastKeyRef.current = toastKey
      if (state === "completed") {
        const result = bulkJobQuery.data?.result
        toast.success(result
          ? `Bulk invite done: ${result.created} created, ${result.skippedExisting} skipped${result.duplicates.length ? `, ${result.duplicates.length} duplicates` : ""}`
          : "Bulk invite completed"
        )
      } else {
        toast.error(bulkJobQuery.data?.failedReason || "Bulk invite job failed")
      }
    }
    invitationsQuery.refetch()
  }, [bulkJobId, bulkJobQuery.data, invitationsQuery])

  const bulkResultToShow = bulkJobQuery.data?.result ?? latestBulkResult

  const createInvitationForm = useForm<CreateInvitationFormData>({
    resolver: zodResolver(createInvitationSchema),
    defaultValues: { email: "", firstName: "", lastName: "", roleName: "Student", subject: "", message: "" },
  })

  const selectedRoleName = useWatch({ control: createInvitationForm.control, name: "roleName" })

  async function onCreateInvitation(values: CreateInvitationFormData) {
    try {
      await createInvitationMutation.mutateAsync({
        email: values.email,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        roleName: values.roleName,
        subject: values.subject?.trim() || undefined,
        message: values.message?.trim() || undefined,
      })
      toast.success(`Invitation sent to ${values.email}`)
      await invitationsQuery.refetch()
      createInvitationForm.reset({ email: "", firstName: "", lastName: "", roleName: values.roleName, subject: values.subject ?? "", message: values.message ?? "" })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send invitation")
    }
  }

  async function onPreviewSingle() {
    try {
      const v = createInvitationForm.getValues()
      const result = await previewSingleMutation.mutateAsync({
        roleName: v.roleName,
        firstName: v.firstName?.trim() || undefined,
        lastName: v.lastName?.trim() || undefined,
        subject: v.subject?.trim() || undefined,
        message: v.message?.trim() || undefined,
      })
      setPreviewModalData(result)
      setPreviewModalOpen(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate preview")
    }
  }

  function buildBulkPayload() {
    const normalized = bulkInvites
      .map((r) => ({ email: r.email.trim(), firstName: r.firstName.trim(), lastName: r.lastName.trim() }))
      .filter((r) => r.email || r.firstName || r.lastName)

    if (!normalized.length) { toast.message("Add at least one student"); return null }
    if (normalized.length > 50) { toast.error("Maximum 50 invites per request"); return null }

    const firstBad = normalized.findIndex((r) => !r.email || !r.firstName || !r.lastName || !isLikelyEmail(r.email))
    if (firstBad !== -1) { toast.error(`Row ${firstBad + 1} is invalid.`); return null }

    const unique = uniqueInvitesByEmail(normalized)
    if (unique.length !== normalized.length) toast.message("Duplicate emails removed")

    return { invites: unique, subject: bulkSubject.trim() || undefined, message: bulkMessage.trim() || undefined }
  }

  function updateBulkRow(index: number, patch: Partial<BulkInviteRow>) {
    setBulkInvites((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  function addBulkRow() {
    setBulkInvites((rows) => {
      if (rows.length >= 50) { toast.error("Maximum 50 rows"); return rows }
      return [...rows, { email: "", firstName: "", lastName: "" }]
    })
  }

  function removeBulkRow(index: number) {
    setBulkInvites((rows) => rows.length <= 1 ? rows : rows.filter((_, i) => i !== index))
  }

  async function onBulkInviteSync() {
    const payload = buildBulkPayload()
    if (!payload) return
    try {
      const result = await bulkSyncMutation.mutateAsync(payload)
      setLatestBulkResult(result)
      setBulkJobId(null)
      toast.success(`${result.created} created, ${result.skippedExisting} skipped`)
      await invitationsQuery.refetch()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk invite failed")
    }
  }

  async function onBulkInviteAsync() {
    const payload = buildBulkPayload()
    if (!payload) return
    try {
      const result = await bulkAsyncMutation.mutateAsync(payload)
      setBulkJobId(result.jobId)
      setLatestBulkResult(null)
      toast.success(`Job queued (ID: ${result.jobId})`)
      await invitationsQuery.refetch()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to enqueue job")
    }
  }

  async function onImportFileChange(file: File | null) {
    if (!file) return
    try {
      setImportFileName(file.name)
      setImportValidInvites([])
      setImportInvalidRows([])

      const ext = file.name.split(".").pop()?.toLowerCase()
      if (ext !== "xlsx") { toast.error("Upload a .xlsx file"); return }

      const buf = await file.arrayBuffer()
      const XLSX = await import("xlsx")
      const workbook = XLSX.read(buf, { type: "array" })
      const invitesSheetName = workbook.SheetNames.find((n) => n.trim().toUpperCase() === "INVITES")
      const sheetName = invitesSheetName ?? workbook.SheetNames[0]
      if (!sheetName) { toast.error("No worksheet found"); return }

      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: "" })
      const invalid: ImportedInvalidRow[] = []
      const valid: BulkInviteStudentItemDto[] = []
      const seen = new Set<string>()

      data.forEach((row, index) => {
        const email = getCellValue(row, "email").trim().toLowerCase()
        const firstName = getCellValue(row, "firstname").trim()
        const lastName = getCellValue(row, "lastname").trim()
        if (!email && !firstName && !lastName) return
        if (!email || !isLikelyEmail(email)) { invalid.push({ rowNumber: index + 2, reason: "Invalid email" }); return }
        if (!firstName || !lastName) { invalid.push({ rowNumber: index + 2, reason: "Missing name" }); return }
        if (seen.has(email)) { invalid.push({ rowNumber: index + 2, reason: "Duplicate email" }); return }
        seen.add(email)
        valid.push({ email, firstName, lastName })
      })

      setImportValidInvites(valid)
      setImportInvalidRows(invalid)
      toast.success(`${valid.length} valid invites imported${invalid.length ? ` (${invalid.length} invalid)` : ""}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to import file")
    }
  }

  function loadImportedIntoTable() {
    if (!importValidInvites.length) { toast.message("No valid imported invites"); return }
    setBulkInvites(importValidInvites.slice(0, 50).map((x) => ({ email: x.email, firstName: x.firstName, lastName: x.lastName })))
    toast.success("Loaded into table")
  }

  async function sendImportedInBatchesSync() {
    if (!importValidInvites.length) { toast.message("No valid imported invites"); return }
    const subject = bulkSubject.trim() || undefined
    const message = bulkMessage.trim() || undefined
    const batches = chunk(importValidInvites, 50)
    setImportIsSending(true)
    try {
      let totalCreated = 0, totalSkipped = 0, totalDuplicates = 0
      for (let i = 0; i < batches.length; i++) {
        toast.message(`Sending batch ${i + 1}/${batches.length}…`)
        const result = await bulkSyncMutation.mutateAsync({ invites: batches[i], subject, message })
        totalCreated += result.created
        totalSkipped += result.skippedExisting
        totalDuplicates += result.duplicates.length
      }
      toast.success(`${totalCreated} created, ${totalSkipped} skipped${totalDuplicates ? `, ${totalDuplicates} duplicates` : ""}`)
      await invitationsQuery.refetch()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send imported invites")
    } finally {
      setImportIsSending(false)
    }
  }

  async function onPreviewBulk() {
    try {
      const result = await previewBulkMutation.mutateAsync({
        roleName: "Student",
        firstName: bulkPreviewFirstName.trim() || undefined,
        lastName: bulkPreviewLastName.trim() || undefined,
        subject: bulkSubject.trim() || undefined,
        message: bulkMessage.trim() || undefined,
      })
      setPreviewModalData(result)
      setPreviewModalOpen(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate preview")
    }
  }

  async function onResend(invitationId: string) {
    try {
      await resendMutation.mutateAsync(invitationId)
      toast.success("Invitation resent")
      await invitationsQuery.refetch()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to resend")
    }
  }

  async function onRevoke(invitationId: string) {
    try {
      await revokeMutation.mutateAsync(invitationId)
      toast.success("Invitation revoked")
      await invitationsQuery.refetch()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to revoke")
    }
  }

  // KPI counts
  const allQuery = useAllTenantInvitationsList({ enabled: true })
  const kpiCounts = useMemo(() => {
    const allInvitations: TenantInvitation[] = allQuery.data ?? []
    return {
      total: allInvitations.length,
      pending: allInvitations.filter((i) => i.status === "PENDING").length,
      accepted: allInvitations.filter((i) => i.status === "ACCEPTED").length,
      expired: allInvitations.filter((i) => i.status === "EXPIRED" || i.status === "REVOKED").length,
    }
  }, [allQuery.data])

  const ROLE_OPTIONS: Array<{ value: CreateInvitationFormData["roleName"]; label: string; color: string }> = [
    { value: "Student", label: "Student", color: "data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-600" },
    { value: "Advisor", label: "Advisor", color: "data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-600" },
    { value: "Coordinator", label: "Coordinator", color: "data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-600" },
  ]

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Invitations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Invite students, advisors, and coordinators to your department
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 mt-1 sm:mt-0"
          onClick={() => invitationsQuery.refetch()}
          disabled={invitationsQuery.isFetching}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", invitationsQuery.isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* ── KPI Row ─────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Sent", value: kpiCounts.total, icon: Mail, sub: "All invitations" },
          { label: "Pending", value: kpiCounts.pending, icon: Users, sub: "Awaiting response" },
          { label: "Accepted", value: kpiCounts.accepted, icon: CheckCircle2, sub: "Successfully joined" },
          { label: "Expired / Revoked", value: kpiCounts.expired, icon: XCircle, sub: "No longer valid" },
        ].map((k) => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{k.label}</CardTitle>
              <k.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{k.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Invite Forms ────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Single Invite */}
        <Card className="flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Invite one user</CardTitle>
                <CardDescription>Send an invitation email to a single person</CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5 flex-1">
            <form className="space-y-4" onSubmit={createInvitationForm.handleSubmit(onCreateInvitation)}>
              {/* Role selector */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</Label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => createInvitationForm.setValue("roleName", opt.value, { shouldValidate: true })}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                        selectedRoleName === opt.value
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name fields */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-firstName" className="text-xs">First name</Label>
                  <Input id="invite-firstName" placeholder="Abebe" className="h-9" {...createInvitationForm.register("firstName")} />
                  {createInvitationForm.formState.errors.firstName && (
                    <p className="text-xs text-destructive">{createInvitationForm.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-lastName" className="text-xs">Last name</Label>
                  <Input id="invite-lastName" placeholder="Kebede" className="h-9" {...createInvitationForm.register("lastName")} />
                  {createInvitationForm.formState.errors.lastName && (
                    <p className="text-xs text-destructive">{createInvitationForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="invite-email" className="text-xs">Email address</Label>
                <Input id="invite-email" type="email" placeholder="user@university.edu" className="h-9" {...createInvitationForm.register("email")} />
                {createInvitationForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{createInvitationForm.formState.errors.email.message}</p>
                )}
              </div>

              <Separator />

              {/* Optional customisation */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Custom message (optional)</p>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-subject" className="text-xs">Subject</Label>
                  <Input id="invite-subject" placeholder="e.g. Welcome to our department" className="h-9" {...createInvitationForm.register("subject")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-message" className="text-xs">Message</Label>
                  <Textarea id="invite-message" rows={3} placeholder="Optional note to the recipient…" {...createInvitationForm.register("message")} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button type="submit" className="flex-1 gap-1.5" disabled={createInvitationMutation.isPending}>
                  {createInvitationMutation.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</>
                    : <><Send className="h-4 w-4" />Send invitation</>}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5"
                  onClick={onPreviewSingle}
                  disabled={previewSingleMutation.isPending}
                  title="Preview email"
                >
                  {previewSingleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  Preview
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Bulk Invite */}
        <Card className="flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Bulk invite students</CardTitle>
                <CardDescription>Add up to 50 students at once</CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5 flex-1 space-y-4">
            <Tabs defaultValue="manual">
              <TabsList className="w-full bg-muted/40 border border-border p-1 h-auto gap-1">
                <TabsTrigger value="manual" className="flex-1 rounded-lg py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Manual entry
                </TabsTrigger>
                <TabsTrigger value="import" className="flex-1 rounded-lg py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Import Excel
                </TabsTrigger>
              </TabsList>

              {/* Manual entry tab */}
              <TabsContent value="manual" className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{bulkInvites.length} / 50 rows</p>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={addBulkRow}>
                    <Plus className="h-3 w-3" /> Add row
                  </Button>
                </div>
                <div className="rounded-xl border overflow-hidden">
                  <ScrollArea className="h-[260px]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead className="text-xs w-[42%]">Email</TableHead>
                          <TableHead className="text-xs w-[24%]">First</TableHead>
                          <TableHead className="text-xs w-[24%]">Last</TableHead>
                          <TableHead className="w-[10%]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bulkInvites.map((row, index) => (
                          <TableRow key={index} className="hover:bg-muted/30">
                            <TableCell className="py-1.5 pr-1">
                              <Input type="email" value={row.email} onChange={(e) => updateBulkRow(index, { email: e.target.value })} placeholder="email@university.edu" className="h-7 text-xs" />
                            </TableCell>
                            <TableCell className="py-1.5 px-1">
                              <Input value={row.firstName} onChange={(e) => updateBulkRow(index, { firstName: e.target.value })} placeholder="First" className="h-7 text-xs" />
                            </TableCell>
                            <TableCell className="py-1.5 px-1">
                              <Input value={row.lastName} onChange={(e) => updateBulkRow(index, { lastName: e.target.value })} placeholder="Last" className="h-7 text-xs" />
                            </TableCell>
                            <TableCell className="py-1.5 pl-1 text-right">
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeBulkRow(index)} disabled={bulkInvites.length <= 1}>
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Import tab */}
              <TabsContent value="import" className="mt-4 space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-muted/40 border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Excel template</p>
                      <p className="text-xs text-muted-foreground">email, firstName, lastName columns — max 50 rows</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8 shrink-0" onClick={async () => { try { await downloadBulkInviteTemplateXlsx(); toast.success("Template downloaded") } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") } }}>
                    <Download className="h-3.5 w-3.5" /> Download
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Upload .xlsx file</Label>
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center">
                    <Input type="file" accept=".xlsx" className="mx-auto max-w-xs" onChange={(e) => onImportFileChange(e.target.files?.[0] ?? null)} />
                    {importFileName && <p className="mt-2 text-xs text-muted-foreground">File: <span className="font-medium">{importFileName}</span></p>}
                  </div>
                </div>

                {(importValidInvites.length > 0 || importInvalidRows.length > 0) && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3 text-center">
                      <p className="text-xl font-bold text-emerald-600">{importValidInvites.length}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Valid rows</p>
                    </div>
                    <div className={cn("rounded-lg border p-3 text-center", importInvalidRows.length > 0 ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800" : "bg-muted/20")}>
                      <p className={cn("text-xl font-bold", importInvalidRows.length > 0 ? "text-destructive" : "text-muted-foreground")}>{importInvalidRows.length}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Invalid rows</p>
                    </div>
                  </div>
                )}

                {importInvalidRows.length > 0 && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="text-sm">Invalid rows</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-4 text-xs space-y-0.5 mt-1">
                        {importInvalidRows.slice(0, 3).map((row) => (
                          <li key={`${row.rowNumber}-${row.reason}`}>Row {row.rowNumber}: {row.reason}</li>
                        ))}
                        {importInvalidRows.length > 3 && <li>…and {importInvalidRows.length - 3} more</li>}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={loadImportedIntoTable} disabled={!importValidInvites.length}>
                    <Upload className="h-3.5 w-3.5" /> Load into table
                  </Button>
                  <Button type="button" size="sm" className="gap-1.5 flex-1" onClick={sendImportedInBatchesSync} disabled={!importValidInvites.length || importIsSending}>
                    {importIsSending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Sending…</> : <><Send className="h-3.5 w-3.5" />Send imported</>}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Shared optional message */}
            <Separator />
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Custom message (optional)</p>
              <div className="space-y-1.5">
                <Label htmlFor="bulk-subject" className="text-xs">Subject</Label>
                <Input id="bulk-subject" value={bulkSubject} onChange={(e) => setBulkSubject(e.target.value)} placeholder="Optional custom subject" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bulk-message" className="text-xs">Message</Label>
                <Textarea id="bulk-message" value={bulkMessage} onChange={(e) => setBulkMessage(e.target.value)} placeholder="Applies to all invitees…" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Preview first name</Label>
                  <Input value={bulkPreviewFirstName} onChange={(e) => setBulkPreviewFirstName(e.target.value)} placeholder="Abebe" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Preview last name</Label>
                  <Input value={bulkPreviewLastName} onChange={(e) => setBulkPreviewLastName(e.target.value)} placeholder="Kebede" className="h-9" />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <Button className="flex-1 gap-1.5" onClick={onBulkInviteSync} disabled={bulkSyncMutation.isPending}>
                {bulkSyncMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Processing…</> : <><Send className="h-4 w-4" />Send now</>}
              </Button>
              <Button variant="outline" className="gap-1.5" onClick={onBulkInviteAsync} disabled={bulkAsyncMutation.isPending}>
                {bulkAsyncMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Queue job
              </Button>
              <Button variant="outline" className="gap-1.5" onClick={onPreviewBulk} disabled={previewBulkMutation.isPending} title="Preview email">
                {previewBulkMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                Preview
              </Button>
            </div>

            {/* Async job status */}
            {bulkJobId && (
              <div className={cn("rounded-xl border px-4 py-3 flex items-center justify-between gap-3", bulkJobQuery.data?.state === "failed" ? "border-destructive/30 bg-destructive/5" : "border-primary/20 bg-primary/5")}>
                <div className="flex items-center gap-2 min-w-0">
                  <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Async job running</p>
                    <p className="text-xs text-muted-foreground truncate">Job ID: {bulkJobId}</p>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">{bulkJobQuery.data?.state ?? "processing"}</Badge>
              </div>
            )}

            {/* Bulk result summary */}
            {bulkResultToShow && (
              <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                <p className="text-sm font-semibold">Last bulk result</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    { label: "Requested", value: bulkResultToShow.requested, className: "" },
                    { label: "Unique", value: bulkResultToShow.unique, className: "" },
                    { label: "Created", value: bulkResultToShow.created, className: "text-emerald-600 font-semibold" },
                    { label: "Skipped", value: bulkResultToShow.skippedExisting, className: "text-amber-600" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg bg-background border px-3 py-2">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className={cn("text-lg font-bold mt-0.5", stat.className)}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Email Preview Modal ──────────────────────────────────────────── */}
      <Dialog open={previewModalOpen} onOpenChange={(open) => { setPreviewModalOpen(open); if (!open) setPreviewModalData(null) }}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Email preview</DialogTitle>
            <DialogDescription>Preview how the invitation email will appear to recipients.</DialogDescription>
          </DialogHeader>
          {previewModalData
            ? <InvitationEmailPreview preview={previewModalData} />
            : <div className="flex h-[200px] items-center justify-center"><p className="text-sm text-muted-foreground">No preview loaded.</p></div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Invitations List ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Invitations</CardTitle>
                <CardDescription>{totalInvitations} invitation{totalInvitations !== 1 ? "s" : ""} shown</CardDescription>
              </div>
            </div>
            {/* Status filter */}
            <div className="flex flex-wrap gap-1.5">
              {(["ALL", "PENDING", "ACCEPTED", "EXPIRED", "REVOKED"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1) }}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                    statusFilter === s
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {invitationsQuery.isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : invitationsQuery.isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error loading invitations</AlertTitle>
              <AlertDescription>{invitationsQuery.error.message}</AlertDescription>
            </Alert>
          ) : totalInvitations === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
                <Mail className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No invitations found</p>
              <p className="text-xs text-muted-foreground mt-1">Sent invitations will appear here</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {pagedInvitations.map((invite) => {
                  const cfg = STATUS_CONFIG[invite.status]
                  const name = (invite.firstName || invite.lastName)
                    ? `${invite.firstName ?? ""} ${invite.lastName ?? ""}`.trim()
                    : null
                  const canAct = isPending(invite)

                  return (
                    <div
                      key={invite.id}
                      className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3 transition-colors hover:bg-muted/60"
                    >
                      {/* Avatar */}
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                        {(name ?? invite.email).charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {name && <p className="text-sm font-medium truncate">{name}</p>}
                          <p className="text-sm text-muted-foreground truncate">{invite.email}</p>
                          <Badge variant="outline" className="text-[10px] px-1.5">{invite.roleName}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Sent {formatIsoToLocal(invite.lastSentAt)} · Expires {formatIsoToLocal(invite.expiresAt)}
                        </p>
                      </div>

                      {/* Status badge */}
                      <Badge
                        variant="outline"
                        className={cn("gap-1 shrink-0 text-[10px] hidden sm:flex", cfg.className)}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </Badge>

                      {/* Actions */}
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => onResend(invite.id)}
                          disabled={!canAct || resendMutation.isPending}
                          title="Resend"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Resend</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onRevoke(invite.id)}
                          disabled={!canAct || revokeMutation.isPending}
                          title="Revoke"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Revoke</span>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    {pageStartIndex + 1}–{pageEndIndexExclusive} of {totalInvitations}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={effectivePage <= 1}>Previous</Button>
                    <span className="flex items-center text-xs text-muted-foreground px-2">
                      {effectivePage} / {totalPages}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={effectivePage >= totalPages}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
