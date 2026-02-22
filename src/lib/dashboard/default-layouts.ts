import { type UserRole } from "@/config/navigation"
import { type DashboardLayoutState, type GridLayouts } from "@/types/dashboard-layout"

function nowIso(): string {
  return new Date().toISOString()
}

function baseLayouts(items: GridLayouts): GridLayouts {
  return {
    lg: items.lg,
    md: items.md,
    sm: items.sm,
    xs: items.xs,
  }
}

export function getDefaultDashboardLayout(role: UserRole): DashboardLayoutState {
  switch (role) {
    case "department_head": {
      const layouts = baseLayouts({
        lg: [
          { i: "dh.kpis", x: 0, y: 0, w: 12, h: 3 },
          { i: "dh.urgent", x: 0, y: 3, w: 8, h: 6 },
          { i: "dh.status", x: 8, y: 3, w: 4, h: 6 },
          { i: "dh.defenses", x: 0, y: 9, w: 12, h: 5 },
        ],
        md: [
          { i: "dh.kpis", x: 0, y: 0, w: 10, h: 3 },
          { i: "dh.urgent", x: 0, y: 3, w: 10, h: 6 },
          { i: "dh.status", x: 0, y: 9, w: 10, h: 6 },
          { i: "dh.defenses", x: 0, y: 15, w: 10, h: 5 },
        ],
        sm: [
          { i: "dh.kpis", x: 0, y: 0, w: 6, h: 3 },
          { i: "dh.urgent", x: 0, y: 3, w: 6, h: 6 },
          { i: "dh.status", x: 0, y: 9, w: 6, h: 6 },
          { i: "dh.defenses", x: 0, y: 15, w: 6, h: 5 },
        ],
        xs: [
          { i: "dh.kpis", x: 0, y: 0, w: 4, h: 3 },
          { i: "dh.urgent", x: 0, y: 3, w: 4, h: 6 },
          { i: "dh.status", x: 0, y: 9, w: 4, h: 6 },
          { i: "dh.defenses", x: 0, y: 15, w: 4, h: 5 },
        ],
      })

      return {
        version: 1,
        role,
        enabledWidgetIds: ["dh.kpis", "dh.urgent", "dh.status", "dh.defenses"],
        layouts,
        widgetSettings: {},
        updatedAt: nowIso(),
      }
    }

    case "coordinator": {
      const layouts = baseLayouts({
        lg: [
          { i: "co.kpis", x: 0, y: 0, w: 12, h: 3 },
          { i: "co.queue", x: 0, y: 3, w: 8, h: 6 },
          { i: "co.focus", x: 8, y: 3, w: 4, h: 6 },
          { i: "co.defenses", x: 0, y: 9, w: 12, h: 5 },
        ],
        md: [
          { i: "co.kpis", x: 0, y: 0, w: 10, h: 3 },
          { i: "co.queue", x: 0, y: 3, w: 10, h: 6 },
          { i: "co.focus", x: 0, y: 9, w: 10, h: 5 },
          { i: "co.defenses", x: 0, y: 14, w: 10, h: 5 },
        ],
        sm: [
          { i: "co.kpis", x: 0, y: 0, w: 6, h: 3 },
          { i: "co.queue", x: 0, y: 3, w: 6, h: 6 },
          { i: "co.focus", x: 0, y: 9, w: 6, h: 5 },
          { i: "co.defenses", x: 0, y: 14, w: 6, h: 5 },
        ],
        xs: [
          { i: "co.kpis", x: 0, y: 0, w: 4, h: 3 },
          { i: "co.queue", x: 0, y: 3, w: 4, h: 6 },
          { i: "co.focus", x: 0, y: 9, w: 4, h: 5 },
          { i: "co.defenses", x: 0, y: 14, w: 4, h: 5 },
        ],
      })

      return {
        version: 1,
        role,
        enabledWidgetIds: ["co.kpis", "co.queue", "co.focus", "co.defenses"],
        layouts,
        widgetSettings: {},
        updatedAt: nowIso(),
      }
    }

    case "advisor": {
      const layouts = baseLayouts({
        lg: [
          { i: "ad.summary", x: 0, y: 0, w: 12, h: 4 },
          { i: "ad.tasks", x: 0, y: 4, w: 7, h: 6 },
          { i: "ad.schedule", x: 7, y: 4, w: 5, h: 6 },
        ],
        md: [
          { i: "ad.summary", x: 0, y: 0, w: 10, h: 4 },
          { i: "ad.tasks", x: 0, y: 4, w: 10, h: 6 },
          { i: "ad.schedule", x: 0, y: 10, w: 10, h: 6 },
        ],
        sm: [
          { i: "ad.summary", x: 0, y: 0, w: 6, h: 4 },
          { i: "ad.tasks", x: 0, y: 4, w: 6, h: 6 },
          { i: "ad.schedule", x: 0, y: 10, w: 6, h: 6 },
        ],
        xs: [
          { i: "ad.summary", x: 0, y: 0, w: 4, h: 4 },
          { i: "ad.tasks", x: 0, y: 4, w: 4, h: 6 },
          { i: "ad.schedule", x: 0, y: 10, w: 4, h: 6 },
        ],
      })

      return {
        version: 1,
        role,
        enabledWidgetIds: ["ad.summary", "ad.tasks", "ad.schedule"],
        layouts,
        widgetSettings: {},
        updatedAt: nowIso(),
      }
    }

    case "student": {
      const layouts = baseLayouts({
        lg: [
          { i: "st.kpis", x: 0, y: 0, w: 12, h: 3 },
          { i: "st.timeline", x: 0, y: 3, w: 8, h: 5 },
          { i: "st.actions", x: 8, y: 3, w: 4, h: 5 },
          { i: "st.defense", x: 0, y: 8, w: 12, h: 4 },
        ],
        md: [
          { i: "st.kpis", x: 0, y: 0, w: 10, h: 3 },
          { i: "st.timeline", x: 0, y: 3, w: 10, h: 5 },
          { i: "st.actions", x: 0, y: 8, w: 10, h: 5 },
          { i: "st.defense", x: 0, y: 13, w: 10, h: 4 },
        ],
        sm: [
          { i: "st.kpis", x: 0, y: 0, w: 6, h: 3 },
          { i: "st.timeline", x: 0, y: 3, w: 6, h: 5 },
          { i: "st.actions", x: 0, y: 8, w: 6, h: 5 },
          { i: "st.defense", x: 0, y: 13, w: 6, h: 4 },
        ],
        xs: [
          { i: "st.kpis", x: 0, y: 0, w: 4, h: 3 },
          { i: "st.timeline", x: 0, y: 3, w: 4, h: 5 },
          { i: "st.actions", x: 0, y: 8, w: 4, h: 5 },
          { i: "st.defense", x: 0, y: 13, w: 4, h: 4 },
        ],
      })

      return {
        version: 1,
        role,
        enabledWidgetIds: ["st.kpis", "st.timeline", "st.actions", "st.defense"],
        layouts,
        widgetSettings: {},
        updatedAt: nowIso(),
      }
    }

    case "department_committee": {
      const layouts = baseLayouts({
        lg: [
          { i: "dc.summary", x: 0, y: 0, w: 12, h: 4 },
          { i: "dc.assigned", x: 0, y: 4, w: 7, h: 6 },
          { i: "dc.schedule", x: 7, y: 4, w: 5, h: 6 },
        ],
        md: [
          { i: "dc.summary", x: 0, y: 0, w: 10, h: 4 },
          { i: "dc.assigned", x: 0, y: 4, w: 10, h: 6 },
          { i: "dc.schedule", x: 0, y: 10, w: 10, h: 6 },
        ],
        sm: [
          { i: "dc.summary", x: 0, y: 0, w: 6, h: 4 },
          { i: "dc.assigned", x: 0, y: 4, w: 6, h: 6 },
          { i: "dc.schedule", x: 0, y: 10, w: 6, h: 6 },
        ],
        xs: [
          { i: "dc.summary", x: 0, y: 0, w: 4, h: 4 },
          { i: "dc.assigned", x: 0, y: 4, w: 4, h: 6 },
          { i: "dc.schedule", x: 0, y: 10, w: 4, h: 6 },
        ],
      })

      return {
        version: 1,
        role,
        enabledWidgetIds: ["dc.summary", "dc.assigned", "dc.schedule"],
        layouts,
        widgetSettings: {},
        updatedAt: nowIso(),
      }
    }

    default: {
      const exhaustive: never = role
      return exhaustive
    }
  }
}
