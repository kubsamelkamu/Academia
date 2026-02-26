"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/auth-store"
import { getPrimaryRoleFromBackendRoles } from "@/lib/auth/dashboard-role-paths"
import { submitTenantVerificationDocument } from "@/lib/api/tenant-verification"

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const

type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED" | null

type StatusUi = {
  label: string
  badgeVariant: "default" | "secondary" | "outline" | "destructive"
  description: string
  badgeClassName?: string
}

function getStatusUi(status: VerificationStatus): StatusUi {
  if (status === "PENDING") {
    return {
      label: "Pending",
      badgeVariant: "secondary",
      description:
        "We received your document. You can keep using the platform while an admin reviews it. You’ll be notified when a decision is made.",
    }
  }

  if (status === "APPROVED") {
    return {
      label: "Approved",
      badgeVariant: "default",
      description: "Your department head account is verified. No further action is required.",
      badgeClassName:
        "bg-emerald-600 text-white hover:bg-emerald-600/90 dark:bg-emerald-500 dark:hover:bg-emerald-500/90",
    }
  }

  if (status === "REJECTED") {
    return {
      label: "Rejected",
      badgeVariant: "destructive",
      description: "Your last submission was rejected. Review the reason below and upload a new document to continue.",
    }
  }

  return {
    label: "Not submitted",
    badgeVariant: "outline",
    description: "Upload a verification document to submit for admin review.",
  }
}

export default function VerifyInstitutionPage() {
  const router = useRouter()

  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const fetchMe = useAuthStore((s) => s.fetchMe)

  const didRefreshOnMount = useRef(false)

  const primaryRole = useMemo(() => getPrimaryRoleFromBackendRoles(user?.roles), [user?.roles])

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!accessToken && !isLoading) {
      router.replace("/login")
    }
  }, [accessToken, isLoading, router])

  useEffect(() => {
    if (!accessToken || !user) {
      return
    }

    if (primaryRole !== "department_head") {
      router.replace("/dashboard")
      return
    }

    // Always refresh when opening this page so status changes (e.g. admin approval)
    // are reflected immediately, even if we had a cached PENDING value.
    if (!didRefreshOnMount.current && !isLoading) {
      didRefreshOnMount.current = true
      void fetchMe().catch(() => {
        // ignore; 401 handled by interceptor
      })
    }
  }, [accessToken, fetchMe, isLoading, primaryRole, router, user])

  const status: VerificationStatus | undefined = useMemo(() => {
    if (!user) {
      return undefined
    }

    if (user.tenantVerification === undefined) {
      return undefined
    }

    return user.tenantVerification?.status ?? null
  }, [user])

  const statusUi = useMemo(() => getStatusUi(status ?? null), [status])

  const rejectionReason = user?.tenantVerification?.lastReviewReason ?? null

  const canUpload = status === null || status === "REJECTED"

  const isCheckingStatus = user?.tenantVerification === undefined

  useEffect(() => {
    if (!accessToken || !user) return
    if (primaryRole !== "department_head") return
    if (status !== "PENDING") return

    const refresh = () => {
      if (useAuthStore.getState().isLoading) return
      void useAuthStore.getState().fetchMe().catch(() => {
        // ignore; 401 handled by interceptor
      })
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh()
      }
    }

    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      window.removeEventListener("focus", refresh)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [accessToken, primaryRole, status, user])

  const onSubmit = async () => {
    setSubmitError(null)

    if (!selectedFile) {
      setSubmitError("Please select a file to upload.")
      return
    }

    if (!ALLOWED_MIME_TYPES.includes(selectedFile.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      setSubmitError("Invalid file type. Upload a PDF, JPG, or PNG.")
      return
    }

    if (selectedFile.size > MAX_UPLOAD_BYTES) {
      setSubmitError("File too large. Maximum size is 10MB.")
      return
    }

    try {
      setIsSubmitting(true)
      await submitTenantVerificationDocument(selectedFile)
      toast.success("Document submitted for admin review")
      setSelectedFile(null)
      await fetchMe()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to submit document"
      setSubmitError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!accessToken || !user || primaryRole !== "department_head") {
    return null
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Department Head Verification</CardTitle>
              <CardDescription>
                Submit a document so the platform admin can verify your department head account. You can still use the
                dashboard while your request is under review.
              </CardDescription>
            </div>
            <Badge variant={statusUi.badgeVariant} className={statusUi.badgeClassName}>
              {statusUi.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm font-medium">Current status</p>
            <p className="mt-1 text-sm text-muted-foreground">{statusUi.description}</p>
            {isCheckingStatus ? (
              <p className="mt-2 text-xs text-muted-foreground">Checking your verification status…</p>
            ) : null}
          </div>

          {canUpload ? (
            <div className="space-y-2 rounded-lg border bg-card p-4">
              <p className="text-sm font-medium">What to upload</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>Accepted formats: PDF, JPG, PNG</li>
                <li>Maximum size: 10MB</li>
                <li>Upload an official document that confirms your department/institution status</li>
              </ul>
            </div>
          ) : null}

          {status === "REJECTED" && rejectionReason ? (
            <Alert variant="destructive">
              <AlertDescription>
                <span className="font-medium">Rejection reason:</span> {rejectionReason}
                <span className="mt-2 block text-sm text-muted-foreground">
                  <span className="font-medium">What to do next:</span> Upload an updated document that addresses the
                  reason above, then resubmit for review.
                </span>
              </AlertDescription>
            </Alert>
          ) : null}

          {status === "PENDING" ? (
            <Alert>
              <AlertDescription>
                Submitted successfully. We’ll notify you when the admin reviews it.
              </AlertDescription>
            </Alert>
          ) : null}

          {status === "APPROVED" ? (
            <Alert>
              <AlertDescription>
                Verification complete. If you need to update documents later, contact the platform admin.
              </AlertDescription>
            </Alert>
          ) : null}

          {canUpload ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    setSelectedFile(file)
                    setSubmitError(null)
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  We only store what’s needed for verification.
                </p>
              </div>

              {submitError ? (
                <Alert variant="destructive">
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" onClick={onSubmit} disabled={!selectedFile || isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit for Review"}
                </Button>
                <Button asChild type="button" variant="outline">
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {status === "APPROVED" ? (
                <Button asChild type="button" variant="outline">
                  <a href="mailto:support@academia.et">Email support@academia.et</a>
                </Button>
              ) : (
                <Button asChild type="button" variant="outline">
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
