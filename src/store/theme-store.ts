import { create } from "zustand"
import { persist } from "zustand/middleware"
import { type ThemeColor, type ThemeFont } from "@/lib/themes"

export type ThemeMode = "light" | "dark" | "system"

interface ThemeStore {
  mode: ThemeMode
  color: ThemeColor
  radiusRem: number
  font: ThemeFont
  scaling: number

  setMode: (mode: ThemeMode) => void
  setColor: (color: ThemeColor) => void
  setRadiusRem: (radiusRem: number) => void
  setFont: (font: ThemeFont) => void
  setScaling: (scaling: number) => void
  reset: () => void
}

const defaults: Pick<ThemeStore, "mode" | "color" | "radiusRem" | "font" | "scaling"> = {
  mode: "system",
  color: "zinc",
  radiusRem: 0.625,
  font: "inter",
  scaling: 1,
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      ...defaults,
      setMode: (mode) => set({ mode }),
      setColor: (color) => set({ color }),
      setRadiusRem: (radiusRem) => set({ radiusRem }),
      setFont: (font) => set({ font }),
      setScaling: (scaling) => set({ scaling }),
      reset: () => set({ ...defaults }),
    }),
    {
      name: "academia-theme",
      version: 2,
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<ThemeStore>
        return { ...defaults, ...state }
      },
      partialize: (state) => ({
        mode: state.mode,
        color: state.color,
        radiusRem: state.radiusRem,
        font: state.font,
        scaling: state.scaling,
      }),
    }
  )
)
