import Link from 'next/link'
import { CheckCircle2, Mail, Shield, Lock } from 'lucide-react'

type ForgotPasswordStep = 'request' | 'verify' | 'reset'

interface ForgotPasswordProgressProps {
  currentStep: ForgotPasswordStep
  stepLinks?: Partial<Record<ForgotPasswordStep, string>>
}

export function ForgotPasswordProgress({ currentStep, stepLinks }: ForgotPasswordProgressProps) {
  const steps = [
    { key: 'request', label: 'Request', short: 'Request', icon: Mail },
    { key: 'verify', label: 'Verify', short: 'Verify', icon: Shield },
    { key: 'reset', label: 'Reset', short: 'Reset', icon: Lock },
  ] as const

  const currentIndex = steps.findIndex((step) => step.key === currentStep)

  return (
    <div className="mb-2 flex flex-wrap items-start justify-center gap-x-2 gap-y-4 sm:gap-x-4 md:gap-x-6">
      {steps.map((step, index) => {
        const Icon = index <= currentIndex ? CheckCircle2 : step.icon
        const isActive = step.key === currentStep
        const isCompleted = index < currentIndex
        const stepHref = stepLinks?.[step.key]
        const canNavigate = Boolean(stepHref && !isActive)

        const stepContent = (
          <>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors sm:h-10 sm:w-10 ${
                isCompleted
                  ? 'border-[#ED5F45] bg-[#ED5F45] text-white'
                  : isActive
                    ? 'border-[#ED5F45] text-[#ED5F45]'
                    : 'border-gray-300 text-gray-400'
              } ${canNavigate ? 'group-hover:border-[#ED5F45] group-hover:text-[#ED5F45]' : ''}`}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:h-5" />
            </div>
            <span
              className={`mt-2 max-w-[5rem] text-center text-[11px] font-medium leading-tight sm:max-w-none sm:text-sm ${
                isActive ? 'text-[#ED5F45]' : isCompleted ? 'text-[#ED5F45]' : 'text-gray-500'
              } ${canNavigate ? 'group-hover:text-[#ED5F45] transition-colors' : ''}`}
            >
              <span className="sm:hidden">{step.short}</span>
              <span className="hidden sm:inline">{step.label}</span>
            </span>
          </>
        )

        if (canNavigate && stepHref) {
          return (
            <Link
              key={step.key}
              href={stepHref}
              className="group flex min-w-[4.25rem] flex-col items-center rounded-md px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-w-0"
            >
              {stepContent}
            </Link>
          )
        }

        return (
          <div key={step.key} className="flex min-w-[4.25rem] flex-col items-center sm:min-w-0">
            {stepContent}
          </div>
        )
      })}
    </div>
  )
}
