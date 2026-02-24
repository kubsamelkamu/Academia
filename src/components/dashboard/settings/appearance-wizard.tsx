"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

import { themes, type ThemeFont } from "@/lib/themes"
import { cn } from "@/lib/utils"
import { useThemeStore } from "@/store/theme-store"

type StepId = "mode" | "color" | "font" | "layout"

const steps: Array<{ id: StepId; title: string; description: string }> = [
  {
    id: "mode",
    title: "Theme mode",
    description: "Pick light, dark, or follow your system preference.",
  },
  {
    id: "color",
    title: "Brand color",
    description: "Choose the accent color used across buttons, rings, and the sidebar.",
  },
  {
    id: "font",
    title: "Typography",
    description: "Select a font for the dashboard.",
  },
  {
    id: "layout",
    title: "Shape & scale",
    description: "Adjust radius and text scaling.",
  },
]

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function useMounted(): boolean {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0)
    return () => window.clearTimeout(id)
  }, [])
  return mounted
}

function fontFamilyForPreview(font: ThemeFont): React.CSSProperties["fontFamily"] {
  if (font === "inter") return "var(--font-inter)"
  if (font === "manrope") return "var(--font-manrope)"
  if (font === "playfair") return "var(--font-playfair)"
  return "var(--font-sans)"
}

function AppearancePreview(props: { font: ThemeFont }) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold">Preview</div>

      <Card>
        <CardHeader>
          <CardTitle>Preview Card</CardTitle>
          <CardDescription>See how your changes look.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button">Primary</Button>
            <Button type="button" variant="secondary">
              Secondary
            </Button>
            <Button type="button" variant="outline">
              Outline
            </Button>
          </div>
          <Input placeholder="Type something…" />
          <div className="flex flex-wrap gap-2">
            <Badge>Badge</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="text-sm font-semibold">Aa</span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium">Primary color</div>
            <div className="text-xs text-muted-foreground">This uses the primary theme token.</div>
          </div>
        </div>

        <div className="mt-4 space-y-1">
          <div className="text-sm font-semibold">Typography</div>
          <div className="text-2xl font-bold" style={{ fontFamily: fontFamilyForPreview(props.font) }}>
            The quick brown fox
          </div>
          <div className="text-sm text-muted-foreground" style={{ fontFamily: fontFamilyForPreview(props.font) }}>
            Jumps over the lazy dog. 0123456789
          </div>
        </div>
      </div>
    </div>
  )
}

export function AppearanceWizard() {
  const mounted = useMounted()
  const [stepIndex, setStepIndex] = React.useState(0)

  const { theme, setTheme, resolvedTheme } = useTheme()
  const { color, radiusRem, font, scaling, setColor, setFont, setRadiusRem, setScaling, reset } = useThemeStore()

  const activeStep = steps[stepIndex]

  const resolvedMode = (resolvedTheme ?? theme) === "dark" ? "dark" : "light"

  const progressValue = ((stepIndex + 1) / steps.length) * 100

  if (!mounted) {
    return <p className="text-sm text-muted-foreground">Loading appearance preferences…</p>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">{activeStep.title}</p>
            <p className="text-xs text-muted-foreground">{activeStep.description}</p>
          </div>
          <div className="text-xs text-muted-foreground">
            Step {stepIndex + 1} of {steps.length}
          </div>
        </div>
        <Progress value={progressValue} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          {activeStep.id === "mode" ? (
            <div className="space-y-3">
              <Label>Mode</Label>
              <div className="flex flex-wrap gap-2">
                {(["light", "dark", "system"] as const).map((mode) => (
                  <Button
                    key={mode}
                    size="sm"
                    variant={theme === mode ? "default" : "outline"}
                    type="button"
                    onClick={() => setTheme(mode)}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                System will follow your OS setting. Your selection applies across the app.
              </p>
            </div>
          ) : null}

          {activeStep.id === "color" ? (
            <div className="space-y-3">
              <Label>Color theme</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {themes.map((t) => {
                  const vars = resolvedMode === "dark" ? t.cssVars.dark : t.cssVars.light
                  return (
                    <Button
                      key={t.name}
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => setColor(t.name)}
                      className={cn("justify-start", color === t.name && "border-2 border-primary")}
                    >
                      <span
                        className="mr-2 inline-flex h-4 w-4 shrink-0 rounded-full border"
                        style={{ backgroundColor: `oklch(${vars.primary})` }}
                        aria-hidden
                      />
                      {t.label}
                    </Button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                This changes `--primary` and related tokens used by buttons, focus rings, and the sidebar.
              </p>
            </div>
          ) : null}

          {activeStep.id === "font" ? (
            <div className="space-y-3">
              <Label>Font</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  [
                    ["inter", "Inter"],
                    ["manrope", "Manrope"],
                    ["playfair", "Playfair"],
                    ["system", "System"],
                  ] as Array<[ThemeFont, string]>
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={font === value ? "default" : "outline"}
                    type="button"
                    onClick={() => setFont(value)}
                    style={{ fontFamily: fontFamilyForPreview(value) }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Font updates the dashboard shell only.</p>
            </div>
          ) : null}

          {activeStep.id === "layout" ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Radius</Label>
                <div className="flex flex-wrap gap-2">
                  {([0.375, 0.5, 0.625, 0.75, 1.0] as const).map((value) => (
                    <Button
                      key={value}
                      size="sm"
                      variant={radiusRem === value ? "default" : "outline"}
                      type="button"
                      onClick={() => setRadiusRem(value)}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Current: {radiusRem.toFixed(3)}rem</p>
              </div>

              <div className="space-y-3">
                <Label>Scaling</Label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      [0.875, "Small"],
                      [1, "Normal"],
                      [1.125, "Large"],
                    ] as const
                  ).map(([value, label]) => (
                    <Button
                      key={value}
                      size="sm"
                      variant={scaling === value ? "default" : "outline"}
                      type="button"
                      onClick={() => setScaling(value)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Fine tune scaling</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step={0.05}
                      min={0.75}
                      max={1.25}
                      value={scaling}
                      onChange={(e) => setScaling(clampNumber(Number(e.target.value), 0.75, 1.25))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Fine tune radius (rem)</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step={0.125}
                      min={0.25}
                      max={1.25}
                      value={radiusRem}
                      onChange={(e) => setRadiusRem(clampNumber(Number(e.target.value), 0.25, 1.25))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reset()
                    toast.success("Appearance reset")
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStepIndex((s) => Math.max(0, s - 1))}
              disabled={stepIndex === 0}
            >
              Back
            </Button>

            {stepIndex < steps.length - 1 ? (
              <Button type="button" onClick={() => setStepIndex((s) => Math.min(steps.length - 1, s + 1))}>
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() =>
                  toast.success("Appearance updated", {
                    description: "Your theme preferences are applied immediately.",
                  })
                }
              >
                Done
              </Button>
            )}
          </div>
        </div>

        <AppearancePreview font={font} />
      </div>
    </div>
  )
}
