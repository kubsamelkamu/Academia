"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

function CoordinatorDashboardLoadingShell() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center rounded-lg border bg-background shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
    )
}

const CoordinatorDashboard = dynamic(
    () => import("@/components/dashboard/roles/coordinator-dashboard").then((module) => module.CoordinatorDashboard),
    {
        ssr: false,
        loading: CoordinatorDashboardLoadingShell,
    }
)

export default function CoordinatorDashboardPage() {
    return <CoordinatorDashboard />
}