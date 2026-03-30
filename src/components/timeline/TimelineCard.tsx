"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, AlertTriangle, Timer } from "lucide-react"
import { ProjectTimeline } from "@/data/timelineData"

interface TimelineCardProps {
  timeline: ProjectTimeline
  projectTitle: string
}

export function TimelineCard({ timeline, projectTitle }: TimelineCardProps) {
  const getStatusIcon = (status: ProjectTimeline['status']) => {
    switch (status) {
      case 'on_track':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'at_risk':
        return <AlertTriangle className="h-4 w-4 text-warning" />
      case 'overdue':
        return <Timer className="h-4 w-4 text-destructive" />
    }
  }

  const getStatusColor = (status: ProjectTimeline['status']) => {
    switch (status) {
      case 'on_track':
        return 'bg-success/10 border-success/20'
      case 'at_risk':
        return 'bg-warning/10 border-warning/20'
      case 'overdue':
        return 'bg-destructive/10 border-destructive/20'
    }
  }

  return (
    <Card className={`${getStatusColor(timeline.status)} border`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="truncate">{projectTitle}</span>
          {getStatusIcon(timeline.status)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{timeline.overallProgress}%</span>
        </div>
        <Progress value={timeline.overallProgress} className="h-2" />

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className="text-muted-foreground">
              {timeline.daysRemaining > 0
                ? `${timeline.daysRemaining} days left`
                : `${Math.abs(timeline.daysRemaining)} days overdue`}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {timeline.milestones.filter(m => m.status === 'completed').length}/{timeline.milestones.length} milestones
          </Badge>
        </div>

        <div className="space-y-2">
          {timeline.milestones.slice(0, 2).map((milestone) => (
            <div key={milestone.id} className="flex items-center justify-between text-xs">
              <span className="truncate flex-1">{milestone.title}</span>
              <div className="flex items-center gap-1">
                <Progress value={milestone.progress} className="w-12 h-1" />
                <span className="text-muted-foreground w-8 text-right">
                  {milestone.progress}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}