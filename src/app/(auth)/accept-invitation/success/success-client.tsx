'use client'

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AuthCampusBackdrop } from "@/components/auth/auth-campus-backdrop"
import { InvitationOnboardingShell } from "@/components/auth/invitation-onboarding-shell"
import { cn } from "@/lib/utils"
import { readInviteAcceptResult } from "@/lib/auth/invite-onboarding-storage"

export default function AcceptInvitationSuccessClient() {
  const router = useRouter()
  const loginButtonRef = useRef<HTMLAnchorElement | null>(null)

  const stored = useMemo(() => readInviteAcceptResult(), [])
  const temporaryPassword = stored?.result.temporaryPassword ?? ""

  const [hasCopiedPassword, setHasCopiedPassword] = useState(false)
  const [highlight, setHighlight] = useState(false)
  const highlightTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current)
    }
  }, [])

  async function copyPassword() {
    if (!temporaryPassword) return
    try {
      await navigator.clipboard.writeText(temporaryPassword)
      setHasCopiedPassword(true)
      toast.success("Password copied")

      setHighlight(true)
      if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current)
      highlightTimerRef.current = window.setTimeout(() => setHighlight(false), 1200)

      requestAnimationFrame(() => {
        loginButtonRef.current?.focus()
      })
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }

  function onContinue() {
    router.push("/login?from=invite")
  }

  if (!stored) {
    return (
      <AuthCampusBackdrop>
        <InvitationOnboardingShell
          centerVertically={false}
          withGlassStyle
          currentStep="accept"
          title="No password found"
          description="This page needs the result from accepting your invitation. Please open the invitation link from your email again."
        >
          <Button asChild className="w-full font-black uppercase tracking-widest" variant="outline">
            <Link href="/login">Go to login</Link>
          </Button>
        </InvitationOnboardingShell>
      </AuthCampusBackdrop>
    )
  }

  return (
    <AuthCampusBackdrop>
      <InvitationOnboardingShell
        centerVertically={false}
        withGlassStyle
        currentStep="accept"
        title="Copy your temporary password"
        description="You will only see this password once. Copy it now, then continue to login."
      >
      <div className="space-y-4">
        <div className="rounded-md border p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Temporary password</p>
            <Badge variant={hasCopiedPassword ? "secondary" : "outline"}>
              {hasCopiedPassword ? "Copied" : "Step 1 of 2"}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Use this password to sign in, then you’ll be asked to change it.</p>
          <p className="mt-3 break-all font-mono text-sm">{temporaryPassword}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={copyPassword} type="button" variant={hasCopiedPassword ? "secondary" : "outline"}>
              {hasCopiedPassword ? "Copied" : "Copy password"}
            </Button>
          </div>
        </div>

        <div className={cn("rounded-md border p-4 transition", highlight && "ring-2 ring-primary/20")}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Continue to login</p>
            <Badge variant="outline">Step 2 of 2</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Use your email and temporary password to sign in.</p>
          <div className="mt-3 flex flex-col gap-2">
            <Button asChild variant={hasCopiedPassword ? "default" : "outline"}>
              <Link href="/login?from=invite" ref={loginButtonRef}>
                Go to login
              </Link>
            </Button>
            <Button onClick={onContinue} type="button" className="w-full" disabled={!hasCopiedPassword}>
              I copied it, continue
            </Button>
          </div>
        </div>
      </div>
    </InvitationOnboardingShell>
    </AuthCampusBackdrop>
  )
}
