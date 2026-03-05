"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { DashboardEmptyState, DashboardPageHeader, DashboardSectionCard } from "@/components/dashboard/page-primitives"
import {
  useBulkInviteJob,
  useBulkInviteStudentsAsyncJob,
  useBulkInviteStudentsSync,
  useAllTenantInvitationsList,
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

type StatusFilter = "ALL" | InvitationStatus

function formatIsoToLocal(iso: string | null | undefined): string {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString()
}

type BulkInviteRow = {
  email: string
  firstName: string
  lastName: string
}

type ImportedInvalidRow = {
  rowNumber: number
  reason: string
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
  const sheet = XLSX.utils.json_to_sheet(rows, {
    header: ["email", "firstName", "lastName"],
    skipHeader: false,
  })

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
  const next: BulkInviteStudentItemDto[] = []
  for (const invite of invites) {
    const key = invite.email.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    next.push(invite)
  }
  return next
}

function getStatusBadgeVariant(status: InvitationStatus): "secondary" | "outline" | "destructive" {
  if (status === "PENDING") return "secondary"
  if (status === "REVOKED") return "destructive"
  return "outline"
}

function isPending(invite: TenantInvitation): boolean {
  return invite.status === "PENDING" && !invite.revokedAt && !invite.acceptedAt
}

function InvitationEmailPreview({ preview }: { preview: PreviewInvitationEmailResult }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1 text-sm">
        <p className="font-medium">Subject: {preview.subject}</p>
        <p className="text-xs text-muted-foreground">Expires: {formatIsoToLocal(preview.expiresAt)}</p>
      </div>

      <div className="grid gap-1 text-xs">
        <a
          className="text-primary underline underline-offset-4"
          href={preview.acceptUrl}
          target="_blank"
          rel="noreferrer"
        >
          Accept URL
        </a>
        <a
          className="text-primary underline underline-offset-4"
          href={preview.loginUrl}
          target="_blank"
          rel="noreferrer"
        >
          Login URL
        </a>
      </div>

      <Tabs defaultValue="html">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="html">HTML</TabsTrigger>
          <TabsTrigger value="text">Text</TabsTrigger>
        </TabsList>
        <TabsContent value="html">
          <iframe
            title="Invitation email preview"
            sandbox="allow-popups allow-top-navigation-by-user-activation"
            srcDoc={preview.htmlContent}
            className="h-[60vh] min-h-[320px] w-full rounded-md border bg-background"
          />
        </TabsContent>
        <TabsContent value="text">
          <Textarea readOnly value={preview.textContent} rows={10} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function DepartmentHeadInvitationsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING")
  const [page, setPage] = useState(1)
  const [bulkInvites, setBulkInvites] = useState<BulkInviteRow[]>([
    { email: "", firstName: "", lastName: "" },
  ])
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

  const listParams = useMemo(() => {
    if (statusFilter === "ALL") return null
    return { status: statusFilter }
  }, [statusFilter])

  const invitationsByStatusQuery = useTenantInvitationsList(listParams ?? {}, {
    enabled: !isAllStatuses,
  })

  const invitationsAllQuery = useAllTenantInvitationsList({
    enabled: isAllStatuses,
  })

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
      if (data.state === "completed" || data.state === "failed") return false
      return 1500
    },
  })

  const lastBulkJobToastKeyRef = useRef<string | null>(null)

  useEffect(() => {
    const state = bulkJobQuery.data?.state
    if (!state) return
    if (state !== "completed" && state !== "failed") return

    const toastKey = `${bulkJobId ?? ""}:${state}`
    if (lastBulkJobToastKeyRef.current !== toastKey) {
      lastBulkJobToastKeyRef.current = toastKey
      if (state === "completed") {
        const result = bulkJobQuery.data?.result
        if (result) {
          toast.success(
            `Bulk invite completed: ${result.created} created, ${result.skippedExisting} skipped${
              result.duplicates.length ? `, ${result.duplicates.length} duplicates` : ""
            }`
          )
        } else {
          toast.success("Bulk invite completed")
        }
      } else {
        toast.error(bulkJobQuery.data?.failedReason || "Bulk invite job failed")
      }
    }

    invitationsQuery.refetch()
  }, [bulkJobId, bulkJobQuery.data, invitationsQuery])

  const bulkResultToShow = bulkJobQuery.data?.result ?? latestBulkResult

  const createInvitationForm = useForm<CreateInvitationFormData>({
    resolver: zodResolver(createInvitationSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      roleName: "Student",
      subject: "",
      message: "",
    },
  })

  const selectedRoleName = useWatch({
    control: createInvitationForm.control,
    name: "roleName",
  })

  async function onCreateInvitation(values: CreateInvitationFormData) {
    try {
      const dto = {
        email: values.email,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        roleName: values.roleName,
        subject: values.subject?.trim() ? values.subject.trim() : undefined,
        message: values.message?.trim() ? values.message.trim() : undefined,
      }

      await createInvitationMutation.mutateAsync(dto)
      toast.success(`Invitation sent to ${dto.email}`)
      await invitationsQuery.refetch()
      createInvitationForm.reset({
        email: "",
        firstName: "",
        lastName: "",
        roleName: values.roleName,
        subject: values.subject ?? "",
        message: values.message ?? "",
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send invitation")
    }
  }

  async function onPreviewSingle() {
    try {
      const values = createInvitationForm.getValues()
      const result = await previewSingleMutation.mutateAsync({
        roleName: values.roleName,
        firstName: values.firstName?.trim() ? values.firstName.trim() : undefined,
        lastName: values.lastName?.trim() ? values.lastName.trim() : undefined,
        subject: values.subject?.trim() ? values.subject.trim() : undefined,
        message: values.message?.trim() ? values.message.trim() : undefined,
      })
      setPreviewModalData(result)
      setPreviewModalOpen(true)
      toast.success("Preview generated")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate preview")
    }
  }

  function buildBulkPayload(): { invites: BulkInviteStudentItemDto[]; subject?: string; message?: string } | null {
    const normalized = bulkInvites
      .map((row) => ({
        email: row.email.trim(),
        firstName: row.firstName.trim(),
        lastName: row.lastName.trim(),
      }))
      .filter((row) => row.email || row.firstName || row.lastName)

    if (normalized.length === 0) {
      toast.message("Add at least one student")
      return null
    }

    if (normalized.length > 50) {
      toast.error("Maximum 50 invites per request")
      return null
    }

    const firstInvalidIndex = normalized.findIndex(
      (row) => !row.email || !row.firstName || !row.lastName || !isLikelyEmail(row.email)
    )
    if (firstInvalidIndex !== -1) {
      toast.error(`Row ${firstInvalidIndex + 1} is invalid. Provide a valid email, first name, and last name.`)
      return null
    }

    const unique = uniqueInvitesByEmail(normalized)
    if (unique.length !== normalized.length) {
      toast.message("Duplicate emails were removed")
    }

    const subject = bulkSubject.trim() || undefined
    const message = bulkMessage.trim() || undefined

    return {
      invites: unique,
      subject,
      message,
    }
  }

  function updateBulkRow(index: number, patch: Partial<BulkInviteRow>) {
    setBulkInvites((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function addBulkRow() {
    setBulkInvites((rows) => {
      if (rows.length >= 50) {
        toast.error("Maximum 50 rows")
        return rows
      }
      return [...rows, { email: "", firstName: "", lastName: "" }]
    })
  }

  function removeBulkRow(index: number) {
    setBulkInvites((rows) => {
      if (rows.length <= 1) return rows
      return rows.filter((_, i) => i !== index)
    })
  }

  async function onBulkInviteSync() {
    const payload = buildBulkPayload()
    if (!payload) return

    try {
      const result = await bulkSyncMutation.mutateAsync(payload)
      setLatestBulkResult(result)
      setBulkJobId(null)
      toast.success(
        `Bulk invite processed: ${result.created} created, ${result.skippedExisting} skipped${
          result.duplicates.length ? `, ${result.duplicates.length} duplicates` : ""
        }`
      )
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
      toast.success(`Bulk invite job enqueued (Job ID: ${result.jobId})`)
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
      const parsedRows: Array<{ rowNumber: number; email: string; firstName: string; lastName: string }> = []

      if (ext === "xlsx") {
        const buf = await file.arrayBuffer()
        const XLSX = await import("xlsx")
        const workbook = XLSX.read(buf, { type: "array" })

        const invitesSheetName = workbook.SheetNames.find((n) => n.trim().toUpperCase() === "INVITES")
        const sheetName = invitesSheetName ?? workbook.SheetNames[0]
        if (!sheetName) {
          toast.error("No worksheet found in the Excel file")
          return
        }
        const sheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
        data.forEach((row, index) => {
          const email = getCellValue(row, "email")
          const firstName = getCellValue(row, "firstname")
          const lastName = getCellValue(row, "lastname")
          parsedRows.push({
            rowNumber: index + 2,
            email,
            firstName,
            lastName,
          })
        })
      } else {
        toast.error("Unsupported file type. Upload a .xlsx file")
        return
      }

      const invalid: ImportedInvalidRow[] = []
      const valid: BulkInviteStudentItemDto[] = []
      const seen = new Set<string>()

      for (const row of parsedRows) {
        const email = row.email.trim().toLowerCase()
        const firstName = row.firstName.trim()
        const lastName = row.lastName.trim()

        if (!email && !firstName && !lastName) continue

        if (!email || !isLikelyEmail(email)) {
          invalid.push({ rowNumber: row.rowNumber, reason: "Invalid or missing email" })
          continue
        }

        if (!firstName || !lastName) {
          invalid.push({ rowNumber: row.rowNumber, reason: "Missing first name or last name" })
          continue
        }

        if (seen.has(email)) {
          invalid.push({ rowNumber: row.rowNumber, reason: "Duplicate email" })
          continue
        }

        seen.add(email)
        valid.push({ email, firstName, lastName })
      }

      setImportValidInvites(valid)
      setImportInvalidRows(invalid)
      toast.success(`Imported ${valid.length} valid invites${invalid.length ? ` (${invalid.length} invalid)` : ""}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to import file")
    }
  }

  function loadImportedIntoTable() {
    if (!importValidInvites.length) {
      toast.message("No valid imported invites")
      return
    }
    const slice = importValidInvites.slice(0, 50)
    setBulkInvites(slice.map((x) => ({ email: x.email, firstName: x.firstName, lastName: x.lastName })))
    if (importValidInvites.length > 50) {
      toast.message("Loaded first 50 rows into the table")
    } else {
      toast.success("Loaded imported rows into the table")
    }
  }

  async function sendImportedInBatchesSync() {
    if (!importValidInvites.length) {
      toast.message("No valid imported invites")
      return
    }

    const subject = bulkSubject.trim() || undefined
    const message = bulkMessage.trim() || undefined
    const batches = chunk(importValidInvites, 50)

    setImportIsSending(true)
    try {
      let totalCreated = 0
      let totalSkipped = 0
      let totalDuplicates = 0

      for (let i = 0; i < batches.length; i += 1) {
        toast.message(`Sending batch ${i + 1}/${batches.length}...`)
        const result = await bulkSyncMutation.mutateAsync({
          invites: batches[i],
          subject,
          message,
        })
        totalCreated += result.created
        totalSkipped += result.skippedExisting
        totalDuplicates += result.duplicates.length
      }

      toast.success(
        `Imported invites sent: ${totalCreated} created, ${totalSkipped} skipped${
          totalDuplicates ? `, ${totalDuplicates} duplicates` : ""
        }`
      )
      await invitationsQuery.refetch()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send imported invites")
    } finally {
      setImportIsSending(false)
    }
  }

  async function onPreviewBulk() {
    try {
      const subject = bulkSubject.trim() || undefined
      const message = bulkMessage.trim() || undefined
      const firstName = bulkPreviewFirstName.trim() || undefined
      const lastName = bulkPreviewLastName.trim() || undefined

      const result = await previewBulkMutation.mutateAsync({
        roleName: "Student",
        firstName,
        lastName,
        subject,
        message,
      })

      setPreviewModalData(result)
      setPreviewModalOpen(true)
      toast.success("Preview generated")
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


  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Invitations"
        description="Invite students, advisors, and coordinators to your department."
        actions={
          <Button
            variant="outline"
            onClick={() => invitationsQuery.refetch()}
            disabled={invitationsQuery.isFetching}
          >
            Refresh
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSectionCard
          title="Invite one user"
          description="Send an invitation email to a single user."
        >
          <form
            className="space-y-4"
            onSubmit={createInvitationForm.handleSubmit(onCreateInvitation)}
          >
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="user@university.edu"
                {...createInvitationForm.register("email")}
              />
              {createInvitationForm.formState.errors.email ? (
                <p className="text-sm text-destructive">{createInvitationForm.formState.errors.email.message}</p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invite-firstName">First name</Label>
                <Input
                  id="invite-firstName"
                  placeholder="First name"
                  {...createInvitationForm.register("firstName")}
                />
                {createInvitationForm.formState.errors.firstName ? (
                  <p className="text-sm text-destructive">
                    {createInvitationForm.formState.errors.firstName.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-lastName">Last name</Label>
                <Input
                  id="invite-lastName"
                  placeholder="Last name"
                  {...createInvitationForm.register("lastName")}
                />
                {createInvitationForm.formState.errors.lastName ? (
                  <p className="text-sm text-destructive">
                    {createInvitationForm.formState.errors.lastName.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Tabs
                value={selectedRoleName}
                onValueChange={(value) => {
                  createInvitationForm.setValue("roleName", value as CreateInvitationFormData["roleName"], {
                    shouldValidate: true,
                  })
                }}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="Student">Student</TabsTrigger>
                  <TabsTrigger value="Advisor">Advisor</TabsTrigger>
                  <TabsTrigger value="Coordinator">Coordinator</TabsTrigger>
                </TabsList>
              </Tabs>
              {createInvitationForm.formState.errors.roleName ? (
                <p className="text-sm text-destructive">{createInvitationForm.formState.errors.roleName.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-subject">Subject (optional)</Label>
              <Input
                id="invite-subject"
                placeholder="Optional custom subject"
                {...createInvitationForm.register("subject")}
              />
              {createInvitationForm.formState.errors.subject ? (
                <p className="text-sm text-destructive">{createInvitationForm.formState.errors.subject.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-message">Message (optional)</Label>
              <Textarea
                id="invite-message"
                rows={4}
                placeholder="Optional custom message (plain text)"
                {...createInvitationForm.register("message")}
              />
              {createInvitationForm.formState.errors.message ? (
                <p className="text-sm text-destructive">{createInvitationForm.formState.errors.message.message}</p>
              ) : null}
            </div>

            <Button type="submit" disabled={createInvitationMutation.isPending}>
              {createInvitationMutation.isPending ? "Sending..." : "Send invitation"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onPreviewSingle}
              disabled={previewSingleMutation.isPending}
            >
              {previewSingleMutation.isPending ? "Generating..." : "Preview email"}
            </Button>
          </form>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Bulk invite students"
          description="Add up to 50 students (email + first name + last name)."
        >
          <div className="space-y-4">
            <Card>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">Excel template</p>
                    <Badge variant="secondary">.xlsx</Badge>
                    <Badge variant="outline">50 rows</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Download, fill up to 50 rows, then upload to import.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await downloadBulkInviteTemplateXlsx()
                      toast.success("Template downloaded")
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Failed to download template")
                    }
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download template
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>Students</Label>
                <Button type="button" variant="outline" size="sm" onClick={addBulkRow}>
                  Add row
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[44%]">Email</TableHead>
                      <TableHead className="w-[24%]">First name</TableHead>
                      <TableHead className="w-[24%]">Last name</TableHead>
                      <TableHead className="w-[8%]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bulkInvites.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            type="email"
                            value={row.email}
                            onChange={(e) => updateBulkRow(index, { email: e.target.value })}
                            placeholder="student@university.edu"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.firstName}
                            onChange={(e) => updateBulkRow(index, { firstName: e.target.value })}
                            placeholder="First"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.lastName}
                            onChange={(e) => updateBulkRow(index, { lastName: e.target.value })}
                            placeholder="Last"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeBulkRow(index)}
                            disabled={bulkInvites.length <= 1}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <p className="text-xs text-muted-foreground">Rows: {bulkInvites.length} / 50</p>
            </div>

            <div className="space-y-2 rounded-md border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">Import from Excel</p>
                {importFileName ? (
                  <p className="text-xs text-muted-foreground">{importFileName}</p>
                ) : null}
              </div>

              <Input
                type="file"
                accept=".xlsx"
                onChange={(e) => onImportFileChange(e.target.files?.[0] ?? null)}
              />

              <div className="text-xs text-muted-foreground">
                Valid: {importValidInvites.length} · Invalid: {importInvalidRows.length}
              </div>

              {importInvalidRows.length ? (
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium">First invalid rows:</p>
                  <ul className="list-disc pl-5">
                    {importInvalidRows.slice(0, 5).map((row) => (
                      <li key={`${row.rowNumber}-${row.reason}`}>Row {row.rowNumber}: {row.reason}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadImportedIntoTable}
                  disabled={!importValidInvites.length}
                >
                  Load into table
                </Button>
                <Button
                  type="button"
                  onClick={sendImportedInBatchesSync}
                  disabled={!importValidInvites.length || importIsSending || bulkSyncMutation.isPending}
                >
                  {importIsSending ? "Sending imported..." : "Send imported (batched)"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-subject">Subject (optional)</Label>
              <Input
                id="bulk-subject"
                value={bulkSubject}
                onChange={(e) => setBulkSubject(e.target.value)}
                placeholder="Optional custom subject"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-message">Message (optional)</Label>
              <Textarea
                id="bulk-message"
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                placeholder="Optional custom message (applies to all)"
                rows={4}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bulk-preview-first-name">Preview first name (optional)</Label>
                <Input
                  id="bulk-preview-first-name"
                  value={bulkPreviewFirstName}
                  onChange={(e) => setBulkPreviewFirstName(e.target.value)}
                  placeholder="Abebe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk-preview-last-name">Preview last name (optional)</Label>
                <Input
                  id="bulk-preview-last-name"
                  value={bulkPreviewLastName}
                  onChange={(e) => setBulkPreviewLastName(e.target.value)}
                  placeholder="Kebede"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={onBulkInviteSync}
                disabled={bulkSyncMutation.isPending}
              >
                {bulkSyncMutation.isPending ? "Processing..." : "Send now"}
              </Button>
              <Button
                variant="outline"
                onClick={onBulkInviteAsync}
                disabled={bulkAsyncMutation.isPending}
              >
                {bulkAsyncMutation.isPending ? "Enqueuing..." : "Enqueue job"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onPreviewBulk}
                disabled={previewBulkMutation.isPending}
              >
                {previewBulkMutation.isPending ? "Generating..." : "Preview email"}
              </Button>
            </div>

            {bulkJobId ? (
              <div className="rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">Async job</p>
                  <Badge variant="outline">{bulkJobQuery.data?.state ?? "..."}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Job ID: {bulkJobId}</p>
                {bulkJobQuery.data?.state === "failed" ? (
                  <p className="mt-2 text-sm text-destructive">Job failed. Please retry.</p>
                ) : null}
              </div>
            ) : null}

            {bulkResultToShow ? (
              <Card>
                <CardContent className="space-y-2 p-4 text-sm">
                  <p className="font-medium">Bulk result</p>
                  <div className="grid gap-1 text-muted-foreground">
                    <p>Requested: {bulkResultToShow.requested}</p>
                    <p>Unique: {bulkResultToShow.unique}</p>
                    <p>Created: {bulkResultToShow.created}</p>
                    <p>Skipped existing: {bulkResultToShow.skippedExisting}</p>
                    {bulkResultToShow.duplicates.length ? (
                      <p>Duplicates: {bulkResultToShow.duplicates.length}</p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </DashboardSectionCard>
      </div>


      <Dialog
        open={previewModalOpen}
        onOpenChange={(open) => {
          setPreviewModalOpen(open)
          if (!open) setPreviewModalData(null)
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email preview</DialogTitle>
          </DialogHeader>

          {previewModalData ? (
            <InvitationEmailPreview preview={previewModalData} />
          ) : (
            <p className="text-sm text-muted-foreground">No preview loaded.</p>
          )}

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      <DashboardSectionCard
        title="Invitations list"
        description="Resend pending invitations or revoke them."
      >
        <div className="mb-4">
          <Tabs
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as StatusFilter)
              setPage(1)
            }}
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="PENDING">Pending</TabsTrigger>
              <TabsTrigger value="ACCEPTED">Accepted</TabsTrigger>
              <TabsTrigger value="EXPIRED">Expired</TabsTrigger>
              <TabsTrigger value="REVOKED">Revoked</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {invitationsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading invitations...</p>
        ) : invitationsQuery.isError ? (
          <p className="text-sm text-destructive">{invitationsQuery.error.message}</p>
        ) : totalInvitations === 0 ? (
          <DashboardEmptyState
            title="No invitations"
            description="Send an invitation to see it appear here."
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Last sent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedInvitations.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>
                      {invite.firstName || invite.lastName
                        ? `${invite.firstName ?? ""} ${invite.lastName ?? ""}`.trim()
                        : "—"}
                    </TableCell>
                    <TableCell className="font-medium">{invite.email}</TableCell>
                    <TableCell>{invite.roleName}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(invite.status)}>{invite.status}</Badge>
                    </TableCell>
                    <TableCell>{formatIsoToLocal(invite.expiresAt)}</TableCell>
                    <TableCell>{formatIsoToLocal(invite.lastSentAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onResend(invite.id)}
                          disabled={!isPending(invite) || resendMutation.isPending}
                        >
                          Resend
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onRevoke(invite.id)}
                          disabled={!isPending(invite) || revokeMutation.isPending}
                        >
                          Revoke
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-col gap-2 border-t p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {pageStartIndex + 1}-{pageEndIndexExclusive} of {totalInvitations}
              </p>
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={effectivePage <= 1}
                >
                  Prev
                </Button>
                <p className="text-xs text-muted-foreground">
                  Page {effectivePage} / {totalPages}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={effectivePage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </DashboardSectionCard>
    </div>
  )
}
