export type ThemeColor = "zinc" | "blue" | "green" | "orange" | "red"

export type ThemeFont = "inter" | "manrope" | "playfair" | "system"

export interface ThemeConfig {
  name: ThemeColor
  label: string
  cssVars: {
    light: {
      primary: string
      ring: string
    }
    dark: {
      primary: string
      ring: string
    }
  }
}

// Values are oklch channels without the wrapping function.
export const themes: ThemeConfig[] = [
  {
    name: "zinc",
    label: "Zinc",
    cssVars: {
      light: {
        primary: "0.208 0.042 265.755",
        ring: "0.704 0.04 256.788",
      },
      dark: {
        primary: "0.929 0.013 255.508",
        ring: "0.551 0.027 264.364",
      },
    },
  },
  {
    name: "blue",
    label: "Blue",
    cssVars: {
      light: {
        primary: "0.62 0.17 255",
        ring: "0.72 0.14 255",
      },
      dark: {
        primary: "0.72 0.14 255",
        ring: "0.62 0.17 255",
      },
    },
  },
  {
    name: "green",
    label: "Green",
    cssVars: {
      light: {
        primary: "0.72 0.17 145",
        ring: "0.75 0.14 145",
      },
      dark: {
        primary: "0.78 0.14 145",
        ring: "0.62 0.17 145",
      },
    },
  },
  {
    name: "orange",
    label: "Orange",
    cssVars: {
      light: {
        primary: "0.74 0.18 55",
        ring: "0.78 0.14 55",
      },
      dark: {
        primary: "0.8 0.12 55",
        ring: "0.68 0.16 55",
      },
    },
  },
  {
    name: "red",
    label: "Red",
    cssVars: {
      light: {
        primary: "0.62 0.22 25",
        ring: "0.7 0.18 25",
      },
      dark: {
        primary: "0.74 0.16 25",
        ring: "0.62 0.22 25",
      },
    },
  },
]
