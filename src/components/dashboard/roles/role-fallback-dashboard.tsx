"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function RoleFallbackDashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Role-specific dashboard content for this user type will be added in the next steps.
        </p>
      </CardContent>
    </Card>
  )
}
