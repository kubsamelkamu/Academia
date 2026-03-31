"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
  icon: React.ElementType
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
      description: "Your last submission was rejected. Review the reason below and upload a new document to continue.",
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function VerifyInstitutionPage() {
  const router = useRouter()

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

  // Clean up preview URL when component unmounts or file changes
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

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      setSubmitError("Invalid file type. Please upload a PDF, JPG, or PNG.")
      return
    }

    // Validate file size
    if (file.size > MAX_UPLOAD_BYTES) {
      setSubmitError(`File too large. Maximum size is ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.`)
      return
    }

    setSelectedFile(file)
    setSubmitError(null)

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }

    // Simulate upload progress
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setUploadProgress(progress)
      if (progress >= 100) {
        clearInterval(interval)
      }
    }, 100)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const onDrop = (e: React.DragEvent) => {
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
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      await submitTenantVerificationDocument(selectedFile)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      toast.success("Document submitted for admin review", {
        description: "You will be notified when your document has been reviewed.",
      })
      
      // Reset after success
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

  if (!accessToken || !user || primaryRole !== "department_head") {
    return null
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-6 lg:p-8"
    >
      <div className="mx-auto w-full max-w-3xl space-y-6">
        {/* Back Navigation */}
        <motion.div variants={itemVariants}>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-2 hover:bg-transparent"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </motion.div>

        {/* Main Card */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-2 shadow-lg">
            {/* Header with gradient background for approved status */}
            <CardHeader className={cn(
              "relative border-b",
              status === "APPROVED" && "bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent"
            )}>
              <div className="absolute inset-0 bg-grid-primary/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
              <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">Department Head Verification</CardTitle>
                  </div>
                  <CardDescription>
                    Submit a document so the platform admin can verify your department head account. 
                    You can still use the dashboard while your request is under review.
                  </CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant={statusUi.badgeVariant} 
                        className={cn(
                          "px-3 py-1 text-sm gap-1",
                          statusUi.badgeClassName
                        )}
                      >
                        <statusUi.icon className={cn("h-3.5 w-3.5", statusUi.color)} />
                        {statusUi.label}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Current verification status</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              {/* Status Message */}
              <motion.div 
                variants={itemVariants}
                className={cn(
                  "rounded-lg border p-4 transition-colors",
                  status === "APPROVED" && "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10",
                  status === "REJECTED" && "border-destructive/20 bg-destructive/5",
                  status === "PENDING" && "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "rounded-full p-2",
                    status === "APPROVED" && "bg-emerald-500/10",
                    status === "REJECTED" && "bg-destructive/10",
                    status === "PENDING" && "bg-amber-500/10",
                    !status && "bg-muted"
                  )}>
                    <statusUi.icon className={cn("h-5 w-5", statusUi.color)} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Current Status</p>
                    <p className="mt-1 text-sm text-muted-foreground">{statusUi.description}</p>
                    {isCheckingStatus && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-xs text-muted-foreground">Checking your verification status…</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Rejection Reason Alert */}
              <AnimatePresence>
                {status === "REJECTED" && rejectionReason && (
                  <motion.div
                    variants={itemVariants}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <span className="font-medium">Rejection reason:</span> {rejectionReason}
                        <div className="mt-2 text-sm">
                          <span className="font-medium">What to do next:</span> Upload an updated document that 
                          addresses the reason above, then resubmit for review.
                        </div>
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upload Guidelines */}
              {canUpload && (
                <motion.div variants={itemVariants} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Info className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Document Requirements</p>
                      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCheck className="h-4 w-4 text-emerald-500" />
                          <span>Accepted formats: <Badge variant="outline" className="ml-1">PDF</Badge>, <Badge variant="outline">JPG</Badge>, <Badge variant="outline">PNG</Badge></span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCheck className="h-4 w-4 text-emerald-500" />
                          <span>Maximum size: <Badge variant="outline">10MB</Badge></span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCheck className="h-4 w-4 text-emerald-500" />
                          <span>Upload an official document that confirms your department/institution status</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* File Upload Area */}
              {canUpload && (
                <motion.div variants={itemVariants} className="space-y-4">
                  <div
                    className={cn(
                      "relative rounded-lg border-2 border-dashed p-6 transition-all",
                      dragActive && "border-primary bg-primary/5 scale-102",
                      selectedFile && "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10",
                      "hover:border-primary/50 hover:bg-muted/50"
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
                          <div className="rounded-full bg-emerald-500/10 p-3">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type.split("/")[1].toUpperCase()}
                            </p>
                          </div>
                          {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="w-full max-w-xs space-y-2">
                              <Progress value={uploadProgress} className="h-2" />
                              <p className="text-xs text-muted-foreground">{uploadProgress}% uploaded</p>
                            </div>
                          )}
                          {previewUrl && (
                            <div className="relative h-20 w-20 overflow-hidden rounded-lg border">
                              <Image 
                                src={previewUrl} 
                                alt="Preview" 
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
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
                            <p className="mt-1 text-xs text-muted-foreground">
                              PDF, JPG, or PNG (max. 10MB)
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {submitError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{submitError}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button 
                      type="button" 
                      onClick={onSubmit} 
                      disabled={!selectedFile || isSubmitting}
                      className="gap-2 min-w-[140px]"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Submit for Review
                        </>
                      )}
                    </Button>
                    <Button asChild type="button" variant="outline" className="gap-2">
                      <Link href="/dashboard">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                      </Link>
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    We only store what is needed for verification. Your document is encrypted during upload.
                  </p>
                </motion.div>
              )}

              {/* Post-upload States */}
              {!canUpload && (
                <motion.div variants={itemVariants} className="space-y-4">
                  {status === "APPROVED" ? (
                    <div className="rounded-lg bg-emerald-500/5 p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-emerald-500/10 p-2">
                          <Shield className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Verification Complete</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Your account is fully verified. If you need to update documents later, 
                            contact the platform admin.
                          </p>
                          <div className="mt-4 flex gap-2">
                            <Button asChild variant="outline" size="sm" className="gap-2">
                              <a href="mailto:support@academia.et">
                                <Mail className="h-4 w-4" />
                                Email support
                              </a>
                            </Button>
                            <Button asChild variant="outline" size="sm" className="gap-2">
                              <Link href="/dashboard">
                                <ArrowLeft className="h-4 w-4" />
                                Go to Dashboard
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : status === "PENDING" && (
                    <Alert className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <AlertDescription>
                        Submitted successfully. We will notify you when the admin reviews it.
                        <div className="mt-2">
                          <Button asChild variant="link" size="sm" className="px-0">
                            <Link href="/dashboard">Continue to Dashboard →</Link>
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Help Section */}
        <motion.div variants={itemVariants}>
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Need help?</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    If you have questions about the verification process, contact our support team at{' '}
                    <a href="mailto:support@academia.et" className="text-primary hover:underline">
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