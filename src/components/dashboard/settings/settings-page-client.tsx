"use client"

import { useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, ShieldCheck } from "lucide-react"
import { type UserRole } from "@/config/navigation"
import { DepartmentHeadSettingsPageContent } from "@/components/dashboard/department-head/settings-page"
import { UniversitySettingsForm } from "@/components/dashboard/department-head/university-settings"
import { VerifyInstitutionPanel } from "@/components/dashboard/department-head/verify-institution-panel"
import { AppearanceWizard } from "@/components/dashboard/settings/appearance-wizard"
import { DepartmentGroupSizeSettings } from "@/components/dashboard/settings/department-group-size-settings"
import { PushNotificationSettings } from "@/components/dashboard/settings/push-notification-settings"

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
    evaluator: "Evaluator",
  }
  return labels[role]
}

export function SettingsPageClient({ role }: { role: UserRole }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [policies, setPolicies] = useState<PolicyToggle[]>(initialPolicies)
  const [rules, setRules] = useState<NotificationRule[]>(initialRules)

  const showGovernance = role === "department_head" || role === "coordinator"
  const showDepartment = role === "department_head" || role === "coordinator"
  const showUniversity = role === "department_head"
  const showVerification = role === "department_head"

  const allowedTabs = useMemo(() => {
    const tabs = ["appearance", "notifications"]
    if (showGovernance) tabs.push("governance")
    if (showDepartment) tabs.push("department")
    if (showUniversity) tabs.push("university")
    if (showVerification) tabs.push("verification")
    return tabs
  }, [showGovernance, showDepartment, showUniversity, showVerification])

  const activeTab = useMemo(() => {
    const requested = searchParams.get("tab")
    if (requested && allowedTabs.includes(requested)) {
      return requested
    }
    return "appearance"
  }, [allowedTabs, searchParams])

  const onTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "appearance") {
      params.delete("tab")
    } else {
      params.set("tab", value)
    }
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

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

      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="inline-flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-border/60 bg-muted/50 p-1.5 shadow-sm">
          <TabsTrigger value="appearance" className="gap-1.5 data-[state=active]:shadow-sm">
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 data-[state=active]:shadow-sm">
            Notification Preferences
          </TabsTrigger>
          {showGovernance ? (
            <TabsTrigger value="governance" className="gap-1.5 data-[state=active]:shadow-sm">
              Governance
            </TabsTrigger>
          ) : null}
          {showDepartment ? (
            <TabsTrigger value="department" className="gap-1.5 data-[state=active]:shadow-sm">
              Department
            </TabsTrigger>
          ) : null}
          {showUniversity ? (
            <TabsTrigger value="university" className="gap-1.5 data-[state=active]:shadow-sm">
              <Building2 className="h-3.5 w-3.5 opacity-70" aria-hidden />
              University
            </TabsTrigger>
          ) : null}
          {showVerification ? (
            <TabsTrigger value="verification" className="gap-1.5 data-[state=active]:shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5 opacity-70" aria-hidden />
              Verification
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="appearance">
          <DashboardSectionCard
            title="Appearance"
            description="Customize theme mode, brand color, radius, font, and scaling."
            className="text-inherit"
          >
            <AppearanceWizard />
          </DashboardSectionCard>
        </TabsContent>

        <TabsContent value="notifications">
          <DashboardSectionCard
            title="Notification Preferences"
            description="Manage browser alerts, notification sound, and Web Push preferences for this browser."
          >
            <PushNotificationSettings />
          </DashboardSectionCard>
        </TabsContent>

        {showGovernance ? (
          <TabsContent value="governance">
            <DashboardSectionCard
              className="mt-4"
              title="Project Group Size"
              description="Set allowed student group size range for department projects."
            >
              <DepartmentGroupSizeSettings />
            </DashboardSectionCard>

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

        {showUniversity ? (
          <TabsContent value="university">
            <DashboardSectionCard
              title="University Configuration"
              description="Update university address and contact details."
            >
              <UniversitySettingsForm />
            </DashboardSectionCard>
          </TabsContent>
        ) : null}

        {showVerification ? (
          <TabsContent value="verification" className="mt-4">
            <VerifyInstitutionPanel variant="embedded" />
          </TabsContent>
        ) : null}

      </Tabs>
    </div>
  )
}
