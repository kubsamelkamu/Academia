"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"

export default function DevLoginAdvisor() {
    const router = useRouter()
    const { logout } = useAuthStore()

    useEffect(() => {
        // Clear old auth
        logout()

        // Manually set auth store state to a mock advisor session
        useAuthStore.setState({
            accessToken: "mock-advisor-token",
            refreshToken: "mock-advisor-refresh",
            user: {
                id: "mock-advisor-1",
                firstName: "Advisor",
                lastName: "User",
                email: "advisor@example.com",
                roles: ["advisor"],
                tenantId: "mock-tenant",
                tenantDomain: "university.edu",
                status: "ACTIVE",
                emailVerified: true,
                tenant: {
                    id: "mock-tenant",
                    name: "University",
                    domain: "university.edu",
                    status: "ACTIVE",
                }
            },
            tenantDomain: "university.edu",
        })

        // Set role cookie for server components (like the sidebar)
        document.cookie = `academia_role=advisor; Path=/; Max-Age=${60 * 60 * 24 * 30}`;

        // Redirect to advisor dashboard
        router.replace("/dashboard/advisor")
    }, [logout, router])

    return (
        <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-3xl">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
            <p className="font-medium text-purple-700 animate-pulse">Initializing Advisor Session...</p>
        </div>
    )
}
