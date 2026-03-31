"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"

export default function DevLoginCoordinator() {
  const router = useRouter()
  const { logout } = useAuthStore()

  useEffect(() => {
    logout()

    useAuthStore.setState({
      accessToken: "mock-coordinator-token",
      refreshToken: "mock-coordinator-refresh",
      user: {
        id: "mock-coordinator-1",
        firstName: "Coordinator",
        lastName: "User",
        email: "coordinator@example.com",
        roles: ["coordinator"],
        tenantId: "mock-tenant",
        tenantDomain: "university.edu",
        status: "ACTIVE",
        emailVerified: true,
        tenant: {
          id: "mock-tenant",
          name: "University",
          domain: "university.edu",
          status: "ACTIVE",
        },
      },
      tenantDomain: "university.edu",
    })

    document.cookie = `academia_role=coordinator; Path=/; Max-Age=${60 * 60 * 24 * 30}`

    router.replace("/dashboard/coordinator")
  }, [logout, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-3xl">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="animate-pulse font-medium text-primary">Initializing Coordinator Session...</p>
    </div>
  )
}
