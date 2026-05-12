import { CheckCircle2, Circle, Mail, LogIn } from 'lucide-react';

interface RegistrationProgressProps {
  currentStep: 'register' | 'verify' | 'login';
}

export function RegistrationProgress({ currentStep }: RegistrationProgressProps) {
  const steps = [
    { key: 'register', label: 'Register', short: 'Register', icon: Circle },
    { key: 'verify', label: 'Verify Email', short: 'Verify', icon: Mail },
    { key: 'login', label: 'Sign In', short: 'Sign in', icon: LogIn },
  ];

  const getStepIndex = (step: string) => steps.findIndex(s => s.key === step);
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="mb-6 flex flex-wrap items-start justify-center gap-x-2 gap-y-4 sm:mb-8 sm:gap-x-4 md:gap-x-6">
      {steps.map((step, index) => {
        const Icon = index <= currentIndex ? CheckCircle2 : step.icon;
        const isActive = step.key === currentStep;
        const isCompleted = index < currentIndex;

        return (
          <div key={step.key} className="flex min-w-[4.25rem] flex-col items-center sm:min-w-0">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 sm:h-10 sm:w-10 ${
                isCompleted
                  ? 'border-[#ED5F45] bg-[#ED5F45] text-white'
                  : isActive
                  ? 'border-[#ED5F45] text-[#ED5F45]'
                  : 'border-gray-300 text-gray-400'
              }`}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span
              className={`mt-2 max-w-[5rem] text-center text-[11px] font-medium leading-tight sm:max-w-none sm:text-sm ${
                isActive ? 'text-[#ED5F45]' : isCompleted ? 'text-[#ED5F45]' : 'text-gray-500'
              }`}
            >
              <span className="sm:hidden">{step.short}</span>
              <span className="hidden sm:inline">{step.label}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
