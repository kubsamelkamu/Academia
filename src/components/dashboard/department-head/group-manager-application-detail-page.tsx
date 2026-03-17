"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, FileText, User, Calendar, Mail, MessageSquare } from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import StatusBadge from "@/components/shared/StatusBadge"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { type GroupManagerApplication, mockGroupManagerApplications } from "@/data/mockData"
import { cn } from "@/lib/utils"

interface GroupManagerApplicationDetailPageProps {
  applicationId: string
}

export function GroupManagerApplicationDetailPage({
  applicationId,
}: GroupManagerApplicationDetailPageProps) {
  const application = mockGroupManagerApplications.find((a) => a.id === applicationId)
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!application) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md border-destructive/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Application not found</CardTitle>
            <CardDescription>
              The requested group manager application could not be found or may have been removed.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button variant="outline" asChild>
              <Link href="/dashboard/department-head/grades" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Return to Grade Approval
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const handleSubmitDecision = async () => {
    if (!decision) {
      toast.error("Select a decision", {
        description: "Please choose approve or reject before submitting.",
        icon: <AlertCircle className="h-4 w-4" />,
      })
      return
    }

    if (!reason.trim()) {
      toast.error("Reason required", {
        description: "Please provide a short reason for your decision.",
        icon: <AlertCircle className="h-4 w-4" />,
      })
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    if (decision === "approved") {
      toast.success("Application approved", {
      description: `${application.studentName} has been approved as a group leader.`,
        icon: <CheckCircle className="h-4 w-4" />,
        duration: 5000,
      })
    } else {
      toast.warning("Application rejected", {
        description: `${application.studentName}'s request has been rejected.`,
        icon: <XCircle className="h-4 w-4" />,
        duration: 5000,
      })
    }

    setIsSubmitting(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <DashboardPageHeader
        title="Group Leader Application"
        description={`Review and process application from ${application.studentName}`}
        actions={
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link href="/dashboard/department-head/grades">
              <ArrowLeft className="h-4 w-4" />
              Back to Grade Approval
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Application Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-transparent pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Application Details
                  </CardTitle>
                  <CardDescription>
                    Submitted on {application.requestedAt}
                  </CardDescription>
                </div>
                <StatusBadge status={application.status} />
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Applicant Profile */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
                <Avatar className="h-14 w-14 border-2 border-primary/20">
                  <AvatarImage src={`https://avatar.vercel.sh/${application.studentName}`} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(application.studentName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-semibold text-lg">{application.studentName}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{application.email}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="outline" className="gap-1">
                      <User className="h-3 w-3" />
                      Current: <StatusBadge status={application.currentRole} />
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <User className="h-3 w-3" />
                      Requesting: <StatusBadge status={application.requestedRole} />
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Motivation Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Motivation Statement
                </h4>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-lg pointer-events-none" />
                  <div className="relative bg-muted/30 p-5 rounded-lg border border-border/50">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {application.motivation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Info Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/20">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Requested at
                  </p>
                  <p className="text-sm font-medium">{application.requestedAt}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Proposed group</p>
                  <p className="text-sm font-medium">
                    {application.proposedGroupName ?? (
                      <span className="text-muted-foreground italic">Not specified</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Decision Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-b from-primary/5 to-transparent pb-4">
              <CardTitle className="text-lg">Review Decision</CardTitle>
              <CardDescription>
                Make your final decision on this application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Decision Buttons */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant={decision === "approved" ? "default" : "outline"}
                  onClick={() => setDecision("approved")}
                  className={cn(
                    "w-full justify-start gap-3 h-auto py-4 px-4 transition-all",
                    decision === "approved" && "bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                  )}
                >
                  <div className={cn(
                    "p-1 rounded-full",
                    decision === "approved" ? "bg-white/20" : "bg-emerald-100 dark:bg-emerald-900/30"
                  )}>
                    <CheckCircle className={cn(
                      "h-5 w-5",
                      decision === "approved" ? "text-white" : "text-emerald-600 dark:text-emerald-400"
                    )} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold">Approve Application</p>
                    <p className={cn(
                      "text-xs",
                      decision === "approved" ? "text-white/80" : "text-muted-foreground"
                    )}>
                      Grant group manager role
                    </p>
                  </div>
                </Button>

                <Button
                  type="button"
                  variant={decision === "rejected" ? "destructive" : "outline"}
                  onClick={() => setDecision("rejected")}
                  className={cn(
                    "w-full justify-start gap-3 h-auto py-4 px-4 transition-all",
                    decision === "rejected" && "bg-destructive hover:bg-destructive/90"
                  )}
                >
                  <div className={cn(
                    "p-1 rounded-full",
                    decision === "rejected" ? "bg-white/20" : "bg-destructive/10"
                  )}>
                    <XCircle className={cn(
                      "h-5 w-5",
                      decision === "rejected" ? "text-white" : "text-destructive"
                    )} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold">Reject Application</p>
                    <p className={cn(
                      "text-xs",
                      decision === "rejected" ? "text-white/80" : "text-muted-foreground"
                    )}>
                      Decline the request
                    </p>
                  </div>
                </Button>
              </div>

              {/* Simple divider instead of Separator */}
              <div className="border-t border-border/50" />

              {/* Reason Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-1">
                    Decision reason
                    <span className="text-destructive">*</span>
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {reason.length}/500
                  </span>
                </div>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value.slice(0, 500))}
                  rows={6}
                  placeholder="Provide a detailed explanation for your decision. This will be visible to the coordinator and the student."
                  className="resize-none text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Your reason helps maintain transparency and provides valuable feedback.
                </p>
              </div>
            </CardContent>

            <CardFooter className="border-t bg-muted/10 px-6 py-4">
              <Button 
                type="button" 
                onClick={handleSubmitDecision}
                disabled={!decision || !reason.trim() || isSubmitting}
                className="w-full gap-2 h-11"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    Submit Decision
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}