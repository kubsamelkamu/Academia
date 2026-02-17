import { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type LucideIcon } from "lucide-react"

export interface DashboardKpiItem {
  title: string
  value: string
  note?: string
  icon: LucideIcon
}

interface DashboardPageHeaderProps {
  title: string
  description: string
  badge?: string
  actions?: ReactNode
}

export function DashboardPageHeader({
  title,
  description,
  badge,
  actions,
}: DashboardPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {badge ? <Badge variant="secondary">{badge}</Badge> : null}
        </div>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}

interface DashboardKpiGridProps {
  items: DashboardKpiItem[]
}

export function DashboardKpiGrid({ items }: DashboardKpiGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon

        return (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{item.value}</p>
              {item.note ? <p className="text-xs text-muted-foreground">{item.note}</p> : null}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

interface DashboardSectionCardProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function DashboardSectionCard({
  title,
  description,
  children,
  className,
}: DashboardSectionCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

interface DashboardEmptyStateProps {
  title: string
  description: string
}

export function DashboardEmptyState({ title, description }: DashboardEmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  )
}
