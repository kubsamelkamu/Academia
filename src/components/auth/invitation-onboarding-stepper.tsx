import { cn } from "@/lib/utils"
import { Check, Lock, LogIn, Mail } from "lucide-react"

export type InvitationOnboardingStep = "accept" | "login" | "change"

type Step = {
  key: InvitationOnboardingStep
  label: string
  icon: React.ReactNode
  description: string
}

const steps: Step[] = [
  { 
    key: "accept", 
    label: "Accept", 
    icon: <Mail className="w-3.5 h-3.5" />,
    description: "Review & accept invitation"
  },
  { 
    key: "login", 
    label: "Login", 
    icon: <LogIn className="w-3.5 h-3.5" />,
    description: "Sign in with credentials"
  },
  { 
    key: "change", 
    label: "Change password", 
    icon: <Lock className="w-3.5 h-3.5" />,
    description: "Set new password"
  },
]

function stepIndex(step: InvitationOnboardingStep): number {
  return steps.findIndex((s) => s.key === step)
}

export function InvitationOnboardingStepper({
  currentStep,
  showDescription = true,
}: {
  currentStep: InvitationOnboardingStep
  showDescription?: boolean
}) {
  const current = Math.max(0, stepIndex(currentStep))
  const currentMeta = steps[current]

  return (
    <div className="w-full" aria-label="Account setup progress">
      {/* Mobile View - Progress Bar */}
      <div className="mb-3 md:hidden">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Step {current + 1} of {steps.length}
          </span>
          <span className="text-xs font-medium text-foreground">{currentMeta.label}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-[width] duration-300"
            style={{ width: `${((current + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop View - Stepper */}
      <ol className="hidden md:flex items-center gap-3">
        {steps.map((step, index) => {
          const isCompleted = index < current
          const isCurrent = index === current

          return (
            <li key={step.key} className="flex flex-1 items-center gap-3">
              <div className="relative">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                    isCompleted && "border-primary/30 bg-primary/10 text-primary",
                    isCurrent && "border-primary/30 bg-primary text-primary-foreground",
                    !isCompleted && !isCurrent && "border-border bg-background text-muted-foreground"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-xs font-semibold">{step.icon}</span>}
                </div>

                {isCurrent ? (
                  <div className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                ) : null}
              </div>

              <div className="flex flex-col">
                <span
                  className={cn(
                    "text-xs font-medium transition-colors duration-300",
                    (isCurrent || isCompleted) && "text-foreground",
                    !isCompleted && !isCurrent && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {index < steps.length - 1 ? (
                <div className="flex-1 relative">
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center",
                      index < current ? "text-primary/30" : "text-border"
                    )}
                  >
                    <div className="w-full border-t-2 border-current transition-colors duration-300" />
                  </div>
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>

      {showDescription ? <p className="mt-2 text-xs text-muted-foreground">{currentMeta.description}</p> : null}
    </div>
  )
}