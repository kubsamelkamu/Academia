import Link from "next/link"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

type InvitationResultStatus = "accepted" | "rejected" | "error"

type SearchParams = {
  status?: string
  groupId?: string
  groupName?: string
  message?: string
}

interface GroupInvitationResultPageProps {
  searchParams: Promise<SearchParams>
}

function normalizeStatus(value?: string): InvitationResultStatus {
  const raw = (value ?? "").toLowerCase().trim()
  if (raw === "accepted" || raw === "rejected" || raw === "error") return raw
  return "error"
}

export default async function GroupInvitationResultPage({ searchParams }: GroupInvitationResultPageProps) {
  const params = await searchParams

  const status = normalizeStatus(params.status)
  const groupName = params.groupName?.trim() || undefined
  const message = params.message?.trim() || undefined

  if (status === "accepted") {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10 min-h-[70vh] flex items-center">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-muted">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary">Accepted</Badge>
            </div>
            <CardTitle className="text-2xl">Invitation accepted</CardTitle>
            <CardDescription>
              You joined <span className="font-medium text-foreground">{groupName ?? "the group"}</span>.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col sm:flex-row gap-3 border-t justify-center">
            <Button asChild>
              <Link href="/dashboard/student/team">Go to My Group</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Close</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (status === "rejected") {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10 min-h-[70vh] flex items-center">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-muted">
              <XCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary">Rejected</Badge>
            </div>
            <CardTitle className="text-2xl">Invitation rejected</CardTitle>
            <CardDescription>You declined the invitation.</CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col sm:flex-row gap-3 border-t justify-center">
            <Button asChild>
              <Link href="/dashboard/student">Back to Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Close</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const errorMessage = message ?? "Invitation link invalid/expired."

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10 min-h-[70vh] flex items-center">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-muted">
            <AlertCircle className="h-6 w-6 text-primary" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary">Error</Badge>
          </div>
          <CardTitle className="text-2xl">Invitation link invalid/expired</CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col sm:flex-row gap-3 border-t justify-center">
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Contact support</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
