"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, ArrowLeft, Clock, CheckCircle2, XCircle, FileText } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { getPrimaryRoleFromBackendRoles } from "@/lib/auth/dashboard-role-paths"
import { cn } from "@/lib/utils"
import { VerifyInstitutionDialog } from "@/components/dashboard/verify-institution-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"


const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const



export default function VerifyInstitutionPage() {
  const router = useRouter()

  const [open, setOpen] = useState(false)

  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const fetchMe = useAuthStore((s) => s.fetchMe)

  const primaryRole = useMemo(() => getPrimaryRoleFromBackendRoles(user?.roles), [user?.roles])

  const status = useMemo((): VerificationStatus | undefined => {
    if (!user) return undefined
    if (user.tenantVerification === undefined) return undefined
    return user.tenantVerification?.status ?? null
  }, [user])

  const requiresUpload = status === null || status === "REJECTED"

  // Auto-open dialog if verification required
  useEffect(() => {
    if (requiresUpload && accessToken && primaryRole === "department_head") {
      setOpen(true)
    }
  }, [requiresUpload, accessToken, primaryRole])

  useEffect(() => {
    if (!accessToken && !isLoading) {
      router.replace("/login")
    }
  }, [accessToken, isLoading, router])

  useEffect(() => {
    if (!accessToken || !user) return

    if (primaryRole !== "department_head") {
      router.replace("/dashboard")
      return
    }

    if (isLoading) return

    void fetchMe().catch(() => {
      // ignore; 401 handled by interceptor
    })
  }, [accessToken, fetchMe, isLoading, primaryRole, router, user])


  const getStatusUi = (status: VerificationStatus): StatusUi => {
    if (status === "PENDING") {
      return {
        label: "Pending Review",
        badgeVariant: "secondary" as const,
        description: "We received your document. You can keep using the platform while an admin reviews it.",
        icon: Clock,
        color: "text-amber-500",
      }
    }

    if (status === "APPROVED") {
      return {
        label: "Verified",
        badgeVariant: "default" as const,
        description: "Your department head account is verified. No further action is required.",
        badgeClassName: "bg-emerald-600 text-white hover:bg-emerald-600/90",
        icon: CheckCircle2,
        color: "text-emerald-500",
      }
    }

    if (status === "REJECTED") {
      return {
        label: "Rejected",
        badgeVariant: "destructive" as const,
        description: "Your last submission was rejected. Review the reason below and upload a new document.",
        icon: XCircle,
        color: "text-destructive",
      }
    }

    return {
      label: "Not Submitted",
      badgeVariant: "outline" as const,
      description: "Upload a verification document to submit for admin review.",
      icon: FileText,
      color: "text-muted-foreground",
    }
  }

  const statusUi = getStatusUi(status ?? null)

  if (!accessToken || !user || primaryRole !== "department_head") {
    return null
  }


  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-8 flex items-center justify-center">
        <div className="w-full max-w-2xl space-y-6">
          {/* Back Navigation */}
          <Button
            variant="ghost"
            size="lg"
            asChild
            className="gap-3 text-muted-foreground hover:text-foreground hover:bg-primary/5 w-full sm:w-auto justify-start"
          >
            <Link href="/dashboard" className="w-full">
              <ArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Link>
          </Button>

          {/* Trigger Card */}
          <Card className="group relative overflow-hidden border-2 hover:border-primary/50 bg-gradient-to-br from-card via-background to-card shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 rounded-3xl backdrop-blur-sm border-white/20 hover:bg-primary/5">
            <div className="absolute inset-0 bg-grid-white/[0.04] opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity h-2" />
            <CardHeader className="pb-6 relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-all border border-primary/20 shadow-lg">
                  <Shield className="h-10 w-10 text-primary drop-shadow-md" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground via-primary to-primary bg-clip-text text-transparent group-hover:scale-[1.02] transition-transform">
                    Institution Verification
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Verify your department head account to unlock full platform access
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant={statusUi.badgeVariant} 
                        className={cn(
                          "px-4 py-2 text-lg gap-2 h-12 font-semibold shadow-lg",
                          statusUi.badgeClassName || "border-2 border-border/50",
                          requiresUpload && "animate-pulse ring-2 ring-primary/30 shadow-primary/20"
                        )}
                      >
                        <statusUi.icon className={cn("h-5 w-5", statusUi.color)} />
                        {statusUi.label}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={8}>
                      <p>{statusUi.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent className="pb-8 pt-0 relative z-10">
              {requiresUpload ? (
                <Button
                  onClick={() => setOpen(true)}
                  size="lg"
                  className="w-full h-16 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-primary/25 bg-gradient-to-r from-primary to-primary/90 border-2 border-transparent hover:border-primary/50 px-12 transition-all duration-300 group-hover:scale-[1.02] shadow-lg"
                >
                  🔐 Complete Verification Now
                </Button>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-20 w-20 text-emerald-500 mx-auto mb-6 drop-shadow-lg animate-bounce" />
                  <p className="text-2xl font-bold text-emerald-600 mb-4">All Set!</p>
                  <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">Your account is fully verified.</p>
                  <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                    <Button asChild size="lg" className="flex-1 h-14 rounded-xl shadow-xl">
                      <Link href="/dashboard">
                        Go to Dashboard
                      </Link>
                    </Button>
                    <Button 
                      onClick={() => setOpen(true)}
                      variant="outline" 
                      size="lg" 
                      className="flex-1 h-14 rounded-xl shadow-lg border-2"
                    >
                      Re-verify (if needed)
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground/60 mt-8 text-center pt-6 border-t border-muted/20 flex items-center justify-center gap-2">
                <Shield className="h-4 w-4" />
                Secure verification process • Data encrypted end-to-end
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <VerifyInstitutionDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED" | null

type StatusUi = {
  label: string
  badgeVariant: "default" | "secondary" | "outline" | "destructive"
  description: string
  badgeClassName?: string
  icon: React.ElementType
  color: string
}

