'use client'

import { useMemo } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthCampusBackdrop } from "@/components/auth/auth-campus-backdrop"
import { AuthTiltCard } from "@/components/auth/auth-tilt-card"
import { InvitationOnboardingShell } from "@/components/auth/invitation-onboarding-shell"
import { useAcceptInvitation, useAcceptInvitationPreview } from "@/lib/hooks/use-invitations"
import { storeInviteAcceptResult } from "@/lib/auth/invite-onboarding-storage"
import type { AcceptInvitationPreviewResult } from "@/types/invitations"

export default function AcceptInvitationClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tokenFromUrl = searchParams.get("token") ?? ""

  const previewQuery = useAcceptInvitationPreview(tokenFromUrl)
  const preview = previewQuery.data as AcceptInvitationPreviewResult | undefined

  const acceptMutation = useAcceptInvitation()
  const tokenMissing = useMemo(() => !tokenFromUrl, [tokenFromUrl])

  async function onConfirmAccept() {
    try {
      const data = await acceptMutation.mutateAsync({ token: tokenFromUrl })
      storeInviteAcceptResult(tokenFromUrl, data)
      toast.success("Invitation accepted")
      router.push("/accept-invitation/success")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to accept invitation")
    }
  }

  if (tokenMissing) {
    return (
      <AuthCampusBackdrop>
        <AuthTiltCard className="mx-auto w-full max-w-lg">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white shadow-2xl backdrop-blur-2xl dark:bg-slate-900">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#ED5F45] via-[#F47A64] to-[#ED5F45]" />
            <Card className="border-0 shadow-none">
              <CardHeader>
                <CardTitle>Invalid invitation link</CardTitle>
                <CardDescription>Missing invitation token. Please use the link from your email.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full font-black uppercase tracking-widest" variant="outline">
                  <Link href="/login">Go to login</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </AuthTiltCard>
      </AuthCampusBackdrop>
    )
  }

  return (
    <AuthCampusBackdrop>
      <InvitationOnboardingShell
        centerVertically={false}
        withGlassStyle
        currentStep="accept"
        title="Review invitation"
        description="Confirm these details to create your account."
      >
      <div className="space-y-6">
        {previewQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading invitation...</p>
        ) : previewQuery.isError ? (
          <div className="rounded-md border p-4">
            <p className="text-sm font-medium">Unable to load invitation</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The invitation may be expired or invalid.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/login">Go to login</Link>
              </Button>
            </div>
          </div>
        ) : preview ? (
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="invitedName">Invited name</Label>
                <Input id="invitedName" readOnly value={`${preview.firstName} ${preview.lastName}`.trim()} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invitedEmail">Email</Label>
                <Input id="invitedEmail" readOnly value={preview.email} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invitedRole">Role</Label>
                  <Input id="invitedRole" readOnly value={preview.roleName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expires at</Label>
                  <Input id="expiresAt" readOnly value={new Date(preview.expiresAt).toLocaleString()} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenantDept">Tenant / Department</Label>
                <Input id="tenantDept" readOnly value={`${preview.tenantName} / ${preview.departmentName}`} />
              </div>
            </div>

            <Button
              onClick={onConfirmAccept}
              disabled={acceptMutation.isPending}
              className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#ED5F45] via-[#F47A64] to-[#ED5F45] py-6 text-base font-black uppercase tracking-widest text-white shadow-lg shadow-[#ED5F45]/25"
            >
              {acceptMutation.isPending ? "Creating account…" : "Create account"}
            </Button>
          </div>
        ) : null}
      </div>
    </InvitationOnboardingShell>
    </AuthCampusBackdrop>
  )
}
