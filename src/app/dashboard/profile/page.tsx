"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { DashboardPageHeader, DashboardSectionCard } from "@/components/dashboard/page-primitives"
import { ProfileSettings } from "@/components/dashboard/settings/profile-settings"
import { useAuthStore } from "@/store/auth-store"

export default function ProfilePage() {
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    if (!accessToken && !isLoading) {
      router.replace("/login")
    }
  }, [accessToken, isLoading, router])

  if (!accessToken || !user) {
    return <></>
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Profile"
        description="Manage your account profile and security settings."
        actions={null}
      />

      <DashboardSectionCard
        title="Profile"
        description="Update your profile, password, and account security preferences."
      >
        <ProfileSettings />
      </DashboardSectionCard>
    </div>
  )
}
