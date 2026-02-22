import { create } from "zustand"
import { persist } from "zustand/middleware"
import { type ThemeColor, type ThemeFont } from "@/lib/themes"

interface ThemeStore {
  color: ThemeColor
  radiusRem: number
  font: ThemeFont
  scaling: number

  setColor: (color: ThemeColor) => void
  setRadiusRem: (radiusRem: number) => void
  setFont: (font: ThemeFont) => void
  setScaling: (scaling: number) => void
  reset: () => void
}

const defaults: Pick<ThemeStore, "color" | "radiusRem" | "font" | "scaling"> = {
  color: "zinc",
  radiusRem: 0.625,
  font: "inter",
  scaling: 1,
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      ...defaults,
      setColor: (color) => set({ color }),
      setRadiusRem: (radiusRem) => set({ radiusRem }),
      setFont: (font) => set({ font }),
      setScaling: (scaling) => set({ scaling }),
      reset: () => set({ ...defaults }),
    }),
    {
      name: "academia-theme",
      version: 1,
    }
  )
)
