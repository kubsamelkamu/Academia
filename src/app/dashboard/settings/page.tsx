"use client"

import { useMemo, useState } from "react"
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, ShieldCheck, SlidersHorizontal, Users } from "lucide-react"

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

export default function SettingsPage() {
  const [policies, setPolicies] = useState<PolicyToggle[]>(initialPolicies)
  const [rules, setRules] = useState<NotificationRule[]>(initialRules)

  const enabledPolicies = useMemo(() => policies.filter((item) => item.enabled).length, [policies])
  const enabledRules = useMemo(() => rules.filter((item) => item.enabled).length, [rules])

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
        description="Control governance and notification behavior for this department."
        badge="Department Head"
      />

      <DashboardKpiGrid
        items={[
          { title: "Policies Enabled", value: `${enabledPolicies}`, note: "Active governance controls", icon: ShieldCheck },
          { title: "Notification Rules", value: `${enabledRules}`, note: "Escalation and digest policies", icon: Bell },
          { title: "Role Overrides", value: "2", note: "Custom department permissions", icon: Users },
          { title: "Preference Profiles", value: "2", note: "Saved department presets", icon: SlidersHorizontal },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
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
                  <Button size="sm" variant="outline" onClick={() => handleTogglePolicy(policy.id)}>
                    {policy.enabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Notification Rules"
          description="Enable or mute leadership alerts and digest behavior."
        >
          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{rule.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {rule.channel} • {rule.frequency}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <Badge variant={rule.enabled ? "secondary" : "outline"}>
                    {rule.enabled ? "Enabled" : "Muted"}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => handleToggleRule(rule.id)}>
                    {rule.enabled ? "Mute" : "Enable"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DashboardSectionCard>
      </div>
    </div>
  )
}
