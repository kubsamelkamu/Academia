"use client"

import { useEffect, useMemo, useState } from "react"
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { themes, type ThemeFont } from "@/lib/themes"
import { useThemeStore } from "@/store/theme-store"
import { useTheme } from "next-themes"
import { Bell, ShieldCheck, SlidersHorizontal, Users } from "lucide-react"
import * as React from "react"
import { type UserRole } from "@/config/navigation"
import { DepartmentHeadSettingsPageContent } from "@/components/dashboard/department-head/settings-page"
import { ProfileSettings } from "@/components/dashboard/settings/profile-settings"

interface PolicyToggle {
  id: string
  name: string
  description: string
  enabled: boolean
}

interface NotificationRule {
  id: string
  name: string
  channel: "Email" | "In-app"
  frequency: "Instant" | "Daily" | "Weekly"
  enabled: boolean
}

const initialPolicies: PolicyToggle[] = [
  {
    id: "policy-1",
    name: "Strict defense panel validation",
    description: "Enforce reviewer availability and conflict check before publishing.",
    enabled: true,
  },
  {
    id: "policy-2",
    name: "Advisor load cap enforcement",
    description: "Block new assignment when advisor load exceeds department threshold.",
    enabled: true,
  },
  {
    id: "policy-3",
    name: "Auto-escalate delayed projects",
    description: "Raise escalation when project delay exceeds SLA window.",
    enabled: false,
  },
]

const initialRules: NotificationRule[] = [
  {
    id: "rule-1",
    name: "High-risk project alerts",
    channel: "Email",
    frequency: "Instant",
    enabled: true,
  },
  {
    id: "rule-2",
    name: "Coordinator pending approvals digest",
    channel: "In-app",
    frequency: "Daily",
    enabled: true,
  },
  {
    id: "rule-3",
    name: "Weekly governance summary",
    channel: "Email",
    frequency: "Weekly",
    enabled: false,
  },
]

function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    department_head: "Department Head",
    coordinator: "Coordinator",
    advisor: "Advisor",
    student: "Student",
    department_committee: "Committee Member",
  }
  return labels[role]
}

export function SettingsPageClient({ role }: { role: UserRole }) {
  const [policies, setPolicies] = useState<PolicyToggle[]>(initialPolicies)
  const [rules, setRules] = useState<NotificationRule[]>(initialRules)

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0)
    return () => window.clearTimeout(id)
  }, [])

  const { theme, setTheme } = useTheme()
  const { color, radiusRem, font, scaling, setColor, setFont, setRadiusRem, setScaling, reset } = useThemeStore()

  const enabledPolicies = useMemo(() => policies.filter((item) => item.enabled).length, [policies])
  const enabledRules = useMemo(() => rules.filter((item) => item.enabled).length, [rules])

  const showGovernance = role === "department_head" || role === "coordinator"
  const showDepartment = role === "department_head"
  const showProfile = true

  const defaultTab = "appearance"

  const handleTogglePolicy = (policyId: string) => {
    setPolicies((current) =>
      current.map((item) =>
        item.id === policyId
          ? {
              ...item,
              enabled: !item.enabled,
            }
          : item
      )
    )
  }

  const handleToggleRule = (ruleId: string) => {
    setRules((current) =>
      current.map((item) =>
        item.id === ruleId
          ? {
              ...item,
              enabled: !item.enabled,
            }
          : item
      )
    )
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Settings"
        description="Manage appearance and department preferences."
        badge={getRoleLabel(role)}
      />

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          {showGovernance ? <TabsTrigger value="governance">Governance</TabsTrigger> : null}
          {showDepartment ? <TabsTrigger value="department">Department</TabsTrigger> : null}
          {showProfile ? <TabsTrigger value="profile">Profile</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="appearance">
          <DashboardSectionCard
            title="Appearance"
            description="Customize theme mode, brand color, radius, font, and scaling."
          >
            {!mounted ? (
              <p className="text-sm text-muted-foreground">Loading appearance preferences…</p>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Mode</p>
                  <div className="flex flex-wrap gap-2">
                    {(["light", "dark", "system"] as const).map((mode) => (
                      <Button
                        key={mode}
                        size="sm"
                        variant={theme === mode ? "default" : "outline"}
                        type="button"
                        onClick={() => setTheme(mode)}
                      >
                        {mode}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Color</p>
                  <div className="flex flex-wrap gap-2">
                    {themes.map((t) => (
                      <Button
                        key={t.name}
                        size="sm"
                        variant={color === t.name ? "default" : "outline"}
                        type="button"
                        onClick={() => setColor(t.name)}
                      >
                        {t.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Font</p>
                  <div className="flex flex-wrap gap-2">
                    {([
                      ["inter", "Inter"],
                      ["manrope", "Manrope"],
                      ["playfair", "Playfair"],
                      ["system", "System"],
                    ] as Array<[ThemeFont, string]>).map(([value, label]) => (
                      <Button
                        key={value}
                        size="sm"
                        variant={font === value ? "default" : "outline"}
                        type="button"
                        onClick={() => setFont(value)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Radius (rem)</p>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step={0.125}
                    min={0.25}
                    max={1.25}
                    value={radiusRem}
                    onChange={(e) => setRadiusRem(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Default is 0.625</p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Scaling</p>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step={0.05}
                    min={0.75}
                    max={1.25}
                    value={scaling}
                    onChange={(e) => setScaling(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">1.00 = default text size</p>
                </div>

                <div className="flex items-end">
                  <Button type="button" variant="outline" onClick={() => reset()}>
                    Reset appearance
                  </Button>
                </div>
              </div>
            )}
          </DashboardSectionCard>
        </TabsContent>

        {showGovernance ? (
          <TabsContent value="governance">
            <DashboardKpiGrid
              items={[
                { title: "Policies Enabled", value: `${enabledPolicies}`, note: "Active governance controls", icon: ShieldCheck },
                { title: "Notification Rules", value: `${enabledRules}`, note: "Escalation and digest policies", icon: Bell },
                { title: "Role Overrides", value: "2", note: "Custom department permissions", icon: Users },
                { title: "Preference Profiles", value: "2", note: "Saved department presets", icon: SlidersHorizontal },
              ]}
            />

            <div className="mt-4 grid gap-4 xl:grid-cols-3">
              <DashboardSectionCard
                className="xl:col-span-2"
                title="Governance Preferences"
                description="Toggle department policies for reviews, approvals, and escalations."
              >
                <div className="space-y-3">
                  {policies.map((policy) => (
                    <div key={policy.id} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">{policy.name}</p>
                        <Badge variant={policy.enabled ? "secondary" : "outline"}>
                          {policy.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{policy.description}</p>
                      <div className="mt-3">
                        <Button
                          type="button"
                          size="sm"
                          variant={policy.enabled ? "secondary" : "outline"}
                          onClick={() => handleTogglePolicy(policy.id)}
                        >
                          {policy.enabled ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardSectionCard>

              <DashboardSectionCard
                title="Notification Rules"
                description="Configure how and when the system alerts key roles."
              >
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div key={rule.id} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">{rule.name}</p>
                        <Badge variant={rule.enabled ? "secondary" : "outline"}>
                          {rule.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {rule.channel} • {rule.frequency}
                      </p>
                      <div className="mt-3">
                        <Button
                          type="button"
                          size="sm"
                          variant={rule.enabled ? "secondary" : "outline"}
                          onClick={() => handleToggleRule(rule.id)}
                        >
                          {rule.enabled ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardSectionCard>
            </div>
          </TabsContent>
        ) : null}

        {showDepartment ? (
          <TabsContent value="department">
            <DepartmentHeadSettingsPageContent embedded />
          </TabsContent>
        ) : null}

        {showProfile ? (
          <TabsContent value="profile">
            <DashboardSectionCard title="Profile" description="Update your account profile and security settings.">
              <ProfileSettings />
            </DashboardSectionCard>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  )
}
