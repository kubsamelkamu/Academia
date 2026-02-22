import { create } from "zustand"
import { persist } from "zustand/middleware"
import { type UserRole } from "@/config/navigation"
import { getDefaultDashboardLayout } from "@/lib/dashboard/default-layouts"
import { type DashboardLayoutState } from "@/types/dashboard-layout"

interface DashboardLayoutStore {
  layoutsByKey: Record<string, DashboardLayoutState>

  getLayout: (key: string) => DashboardLayoutState | undefined
  getOrCreateLayout: (key: string, role: UserRole) => DashboardLayoutState

  saveLayout: (key: string, layout: DashboardLayoutState) => void
  resetLayout: (key: string, role: UserRole) => void
}

export const useDashboardLayoutStore = create<DashboardLayoutStore>()(
  persist(
    (set, get) => ({
      layoutsByKey: {},

      getLayout: (key) => get().layoutsByKey[key],

      getOrCreateLayout: (key, role) => {
        const existing = get().layoutsByKey[key]
        if (existing) return existing

        const created = getDefaultDashboardLayout(role)
        set((state) => ({
          layoutsByKey: {
            ...state.layoutsByKey,
            [key]: created,
          },
        }))
        return created
      },

      saveLayout: (key, layout) => {
        set((state) => ({
          layoutsByKey: {
            ...state.layoutsByKey,
            [key]: {
              ...layout,
              updatedAt: new Date().toISOString(),
            },
          },
        }))
      },

      resetLayout: (key, role) => {
        const reset = getDefaultDashboardLayout(role)
        set((state) => ({
          layoutsByKey: {
            ...state.layoutsByKey,
            [key]: reset,
          },
        }))
      },
    }),
    {
      name: "academia-dashboard-layouts",
      version: 1,
    }
  )
)
