import Link from 'next/link'
import { CheckCircle2, Mail, Shield, Lock } from 'lucide-react'

type ForgotPasswordStep = 'request' | 'verify' | 'reset'

interface ForgotPasswordProgressProps {
  currentStep: ForgotPasswordStep
  stepLinks?: Partial<Record<ForgotPasswordStep, string>>
}

export function ForgotPasswordProgress({ currentStep, stepLinks }: ForgotPasswordProgressProps) {
  const steps = [
    { key: 'request', label: 'Request', icon: Mail },
    { key: 'verify', label: 'Verify', icon: Shield },
    { key: 'reset', label: 'Reset', icon: Lock },
  ] as const

  const currentIndex = steps.findIndex((step) => step.key === currentStep)

  return (
    <div className="flex items-center justify-center space-x-4 mb-2">
      {steps.map((step, index) => {
        const Icon = index <= currentIndex ? CheckCircle2 : step.icon
        const isActive = step.key === currentStep
        const isCompleted = index < currentIndex
        const stepHref = stepLinks?.[step.key]
        const canNavigate = Boolean(stepHref && !isActive)

        const stepContent = (
          <>
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                isCompleted
                  ? 'bg-green-500 border-green-500 text-white'
                  : isActive
                    ? 'border-blue-500 text-blue-500'
                    : 'border-gray-300 text-gray-400'
              } ${canNavigate ? 'group-hover:border-blue-400 group-hover:text-blue-500' : ''}`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span
              className={`mt-2 text-sm font-medium ${
                isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
              } ${canNavigate ? 'group-hover:text-blue-600 transition-colors' : ''}`}
            >
              {step.label}
            </span>
          </>
        )

        if (canNavigate && stepHref) {
          return (
            <Link
              key={step.key}
              href={stepHref}
              className="group flex flex-col items-center rounded-md px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {stepContent}
            </Link>
          )
        }

        return (
          <div key={step.key} className="flex flex-col items-center">
            {stepContent}
          </div>
        )
      })}
    </div>
  )
}
