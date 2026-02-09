import type { Config } from "tailwindcss"
import tailwindcssAnimate from "tailwindcss-animate"

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#4F46E5", // Indigo
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#64748B", // Slate
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#10B981", // Emerald
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F8FAFC",
          foreground: "#64748B",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
export default config