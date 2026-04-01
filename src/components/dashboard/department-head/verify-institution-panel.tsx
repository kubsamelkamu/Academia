"use client"

import { useEffect, useMemo, useRef, useState, type DragEvent, type ElementType } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuthStore } from "@/store/auth-store"
import { getPrimaryRoleFromBackendRoles } from "@/lib/auth/dashboard-role-paths"
import { submitTenantVerificationDocument } from "@/lib/api/tenant-verification"
import {
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Shield,
  AlertCircle,
  ArrowLeft,
  Mail,
  HelpCircle,
  Lock,
  Info,
  CheckCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const

type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED" | null

type StatusUi = {
  label: string
  badgeVariant: "default" | "secondary" | "outline" | "destructive"
  description: string
  badgeClassName?: string
  icon: ElementType
  color: string
}

function getStatusUi(status: VerificationStatus): StatusUi {
  if (status === "PENDING") {
    return {
      label: "Pending Review",
      badgeVariant: "secondary",
      description:
        "We received your document. You can keep using the platform while an admin reviews it. You will be notified when a decision is made.",
      icon: Clock,
      color: "text-amber-500",
    }
  }

  if (status === "APPROVED") {
    return {
      label: "Verified",
      badgeVariant: "default",
      description: "Your department head account is verified. No further action is required.",
      badgeClassName:
        "bg-emerald-600 text-white hover:bg-emerald-600/90 dark:bg-emerald-500 dark:hover:bg-emerald-500/90",
      icon: CheckCircle2,
      color: "text-emerald-500",
    }
  }

  if (status === "REJECTED") {
    return {
      label: "Rejected",
      badgeVariant: "destructive",
      description:
        "Your last submission was rejected. Review the reason below and upload a new document to continue.",
      icon: XCircle,
      color: "text-destructive",
    }
  }

  return {
    label: "Not Submitted",
    badgeVariant: "outline",
    description: "Upload a verification document to submit for admin review.",
    icon: FileText,
    color: "text-muted-foreground",
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

export type VerifyInstitutionPanelVariant = "page" | "embedded"

export function VerifyInstitutionPanel({ variant = "page" }: { variant?: VerifyInstitutionPanelVariant }) {
  const router = useRouter()
  const embedded = variant === "embedded"

  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const fetchMe = useAuthStore((s) => s.fetchMe)

  const didRefreshOnMount = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const primaryRole = useMemo(() => getPrimaryRoleFromBackendRoles(user?.roles), [user?.roles])

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

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

    if (!didRefreshOnMount.current && !isLoading) {
      didRefreshOnMount.current = true
      void fetchMe().catch(() => {
        // ignore; 401 handled by interceptor
      })
    }
  }, [accessToken, fetchMe, isLoading, primaryRole, router, user])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

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
  const StatusIcon = statusUi.icon

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

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      return
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      setSubmitError("Invalid file type. Please upload a PDF, JPG, or PNG.")
      return
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setSubmitError(`File too large. Maximum size is ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.`)
      return
    }

    setSelectedFile(file)
    setSubmitError(null)

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }

    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setUploadProgress(progress)
      if (progress >= 100) {
        clearInterval(interval)
      }
    }, 100)
  }

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(true)
  }

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0] ?? null
    handleFileChange(file)
  }

  const onSubmit = async () => {
    setSubmitError(null)

    if (!selectedFile) {
      setSubmitError("Please select a file to upload.")
      return
    }

    try {
      setIsSubmitting(true)
      setUploadProgress(0)

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      await submitTenantVerificationDocument(selectedFile)

      clearInterval(progressInterval)
      setUploadProgress(100)

      toast.success("Document submitted for admin review", {
        description: "You will be notified when your document has been reviewed.",
      })

      setTimeout(() => {
        setSelectedFile(null)
        setUploadProgress(0)
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
          setPreviewUrl(null)
        }
        void fetchMe()
      }, 500)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to submit document"
      setSubmitError(message)
      toast.error(message)
      setUploadProgress(0)
    } finally {
      setIsSubmitting(false)
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setSubmitError(null)
    setUploadProgress(0)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const backHref = embedded ? "/dashboard/settings" : "/dashboard"
  const backLabel = embedded ? "All settings" : "Back to Dashboard"

  if (!accessToken || !user || primaryRole !== "department_head") {
    return null
  }

  const shellClass = embedded
    ? "space-y-4"
    : "min-h-screen bg-gradient-to-b from-background via-background to-muted/25 p-4 md:p-6 lg:p-8"

  const innerClass = embedded ? "w-full" : "mx-auto w-full max-w-3xl space-y-6"

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={shellClass}
    >
      <div className={innerClass}>
        {!embedded ? (
          <motion.div variants={itemVariants}>
            <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Link>
            </Button>
          </motion.div>
        ) : null}

        <motion.div variants={itemVariants}>
          <Card
            className={cn(
              "overflow-hidden",
              embedded
                ? "border border-border/80 shadow-sm ring-1 ring-border/40"
                : "border-2 shadow-lg"
            )}
          >
            <CardHeader
              className={cn(
                "relative border-b bg-muted/30 pb-4",
                status === "APPROVED" && "bg-gradient-to-r from-emerald-500/[0.08] via-emerald-500/[0.04] to-transparent",
                embedded && "pt-5"
              )}
            >
              {!embedded ? (
                <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,hsl(var(--primary)/0.03)_50%,transparent_100%)] [mask-image:linear-gradient(0deg,transparent,black)]" />
              ) : null}
              <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg",
                        embedded ? "bg-primary/10" : "bg-primary/15"
                      )}
                    >
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className={cn("text-lg sm:text-xl", embedded && "text-base sm:text-lg")}>
                      Department head verification
                    </CardTitle>
                  </div>
                  <CardDescription className="text-pretty max-w-prose">
                    Submit a document so the platform admin can verify your account. You can keep using the dashboard
                    while your request is reviewed.
                  </CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant={statusUi.badgeVariant}
                        className={cn("gap-1.5 px-3 py-1 text-xs font-medium sm:text-sm", statusUi.badgeClassName)}
                      >
                        <StatusIcon className={cn("h-3.5 w-3.5", statusUi.color)} />
                        {statusUi.label}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="mt-1 rounded-md border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md">
                      <p>Current verification status</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>

            <CardContent className={cn("space-y-5", embedded ? "p-4 sm:p-5" : "p-6")}>
              <motion.div
                variants={itemVariants}
                className={cn(
                  "rounded-xl border p-4 transition-colors",
                  status === "APPROVED" && "border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20",
                  status === "REJECTED" && "border-destructive/25 bg-destructive/[0.06]",
                  status === "PENDING" && "border-amber-200/80 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20",
                  !status && "bg-muted/20"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "rounded-lg p-2",
                      status === "APPROVED" && "bg-emerald-500/15",
                      status === "REJECTED" && "bg-destructive/10",
                      status === "PENDING" && "bg-amber-500/15",
                      !status && "bg-muted"
                    )}
                  >
                    <StatusIcon className={cn("h-5 w-5", statusUi.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Current status</p>
                    <p className="mt-1 text-sm text-muted-foreground">{statusUi.description}</p>
                    {isCheckingStatus ? (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-xs text-muted-foreground">Checking your verification status…</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </motion.div>

              <AnimatePresence>
                {status === "REJECTED" && rejectionReason ? (
                  <motion.div
                    variants={itemVariants}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                  >
                    <Alert variant="destructive" className="rounded-xl border-destructive/40 bg-destructive/[0.06]">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <span className="font-medium">Rejection reason:</span> {rejectionReason}
                        <div className="mt-2 text-sm">
                          <span className="font-medium">What to do next:</span> Upload an updated document that addresses
                          the reason above, then resubmit for review.
                        </div>
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {canUpload ? (
                <motion.div variants={itemVariants} className="rounded-xl border bg-card/50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Info className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Document requirements</p>
                      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span>
                            Accepted formats:{" "}
                            <Badge variant="outline" className="mx-0.5 text-[10px]">
                              PDF
                            </Badge>
                            <Badge variant="outline" className="mx-0.5 text-[10px]">
                              JPG
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              PNG
                            </Badge>
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                          <span>
                            Maximum size:{" "}
                            <Badge variant="outline" className="text-[10px]">
                              10MB
                            </Badge>
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span>Upload an official document that confirms your department or institution status.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ) : null}

              {canUpload ? (
                <motion.div variants={itemVariants} className="space-y-4">
                  <div
                    className={cn(
                      "relative rounded-xl border-2 border-dashed p-6 transition-all",
                      dragActive && "scale-[1.01] border-primary bg-primary/5",
                      selectedFile && "border-emerald-500/60 bg-emerald-50/40 dark:bg-emerald-950/15",
                      !dragActive && !selectedFile && "hover:border-primary/40 hover:bg-muted/30"
                    )}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null
                        handleFileChange(file)
                      }}
                    />

                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                      {selectedFile ? (
                        <>
                          <div className="rounded-full bg-emerald-500/15 p-3">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type.split("/")[1]?.toUpperCase()}
                            </p>
                          </div>
                          {uploadProgress > 0 && uploadProgress < 100 ? (
                            <div className="w-full max-w-xs space-y-2">
                              <Progress value={uploadProgress} className="h-2" />
                              <p className="text-xs text-muted-foreground">{uploadProgress}% uploaded</p>
                            </div>
                          ) : null}
                          {previewUrl ? (
                            <div className="relative h-20 w-20 overflow-hidden rounded-lg border">
                              <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                            </div>
                          ) : null}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              clearFile()
                            }}
                          >
                            Remove file
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="rounded-full bg-muted p-3">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              <span className="text-primary">Click to upload</span> or drag and drop
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">PDF, JPG, or PNG (max. 10MB)</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {submitError ? (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <Alert variant="destructive" className="rounded-xl">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{submitError}</AlertDescription>
                        </Alert>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      onClick={onSubmit}
                      disabled={!selectedFile || isSubmitting}
                      className="min-w-[140px] gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          Submitting…
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Submit for review
                        </>
                      )}
                    </Button>
                    <Button asChild type="button" variant="outline" className="gap-2">
                      <Link href={embedded ? "/dashboard/settings" : "/dashboard"}>
                        <ArrowLeft className="h-4 w-4" />
                        {embedded ? "Settings home" : backLabel}
                      </Link>
                    </Button>
                  </div>

                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3 shrink-0" />
                    We only store what is needed for verification. Your document is encrypted during upload.
                  </p>
                </motion.div>
              ) : null}

              {!canUpload ? (
                <motion.div variants={itemVariants} className="space-y-4">
                  {status === "APPROVED" ? (
                    <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/30 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-emerald-500/15 p-2">
                          <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">Verification complete</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Your account is fully verified. If you need to update documents later, contact the platform
                            admin.
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button asChild variant="outline" size="sm" className="gap-2">
                              <a href="mailto:support@academia.et">
                                <Mail className="h-4 w-4" />
                                Email support
                              </a>
                            </Button>
                            <Button asChild variant="outline" size="sm" className="gap-2">
                              <Link href="/dashboard">
                                <ArrowLeft className="h-4 w-4" />
                                Go to dashboard
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {status === "PENDING" ? (
                    <Alert className="rounded-xl border-amber-200/80 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20">
                      <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertDescription>
                        Submitted successfully. We will notify you when the admin reviews it.
                        <div className="mt-2">
                          <Button asChild variant="link" size="sm" className="h-auto px-0">
                            <Link href="/dashboard">Continue to dashboard →</Link>
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </motion.div>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className={cn("border-dashed", embedded ? "bg-muted/20" : "bg-muted/30")}>
            <CardContent className={cn(embedded ? "p-4" : "p-4")}>
              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Need help?</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Questions about verification? Contact{" "}
                    <a href="mailto:support@academia.et" className="font-medium text-primary hover:underline">
                      support@academia.et
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
