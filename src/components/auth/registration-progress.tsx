import { CheckCircle2, Circle, Mail, LogIn } from 'lucide-react';

interface RegistrationProgressProps {
  currentStep: 'register' | 'verify' | 'login';
}

export function RegistrationProgress({ currentStep }: RegistrationProgressProps) {
  const steps = [
    { key: 'register', label: 'Register', icon: Circle },
    { key: 'verify', label: 'Verify Email', icon: Mail },
    { key: 'login', label: 'Sign In', icon: LogIn },
  ];

  const getStepIndex = (step: string) => steps.findIndex(s => s.key === step);
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {steps.map((step, index) => {
        const Icon = index <= currentIndex ? CheckCircle2 : step.icon;
        const isActive = step.key === currentStep;
        const isCompleted = index < currentIndex;

        return (
          <div key={step.key} className="flex flex-col items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                isCompleted
                  ? 'bg-green-500 border-green-500 text-white'
                  : isActive
                  ? 'border-blue-500 text-blue-500'
                  : 'border-gray-300 text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span
              className={`mt-2 text-sm font-medium ${
                isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}