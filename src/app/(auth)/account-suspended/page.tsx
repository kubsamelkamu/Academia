'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function AccountSuspendedPage() {
  const tenantDomain = useAuthStore((s) => s.tenantDomain)

  const title = 'Institution account suspended'
  const description = useMemo(() => {
    if (!tenantDomain) {
      return 'Your institution account is currently inactive because status verification is incomplete.'
    }

    return `Institution “${tenantDomain}” is currently inactive because status verification is incomplete.`
  }, [tenantDomain])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Login is blocked while the institution is inactive. A Department Head must submit the verification
                document and an admin must review it.
              </AlertDescription>
            </Alert>

            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/login">Back to login</Link>
              </Button>
              <Button asChild variant="outline">
                <a href="mailto:support@academia.et">Contact support</a>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              If you believe this is a mistake, contact support or your platform admin to reactivate the institution.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
