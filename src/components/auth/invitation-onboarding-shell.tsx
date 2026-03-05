'use client'

import type { ReactNode } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { CheckCircle2, Info, Key, Mail, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InvitationOnboardingStepper, type InvitationOnboardingStep } from "@/components/auth/invitation-onboarding-stepper"

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

function getStepTheme(step: InvitationOnboardingStep) {
  if (step === "login") {
    return {
      heroIcon: (
        <Image
          src="/haramaya.png"
          alt="Haramaya University"
          width={44}
          height={44}
          className="object-contain"
          priority
        />
      ),
      heroIconBg: "bg-white/60 border border-white/20 backdrop-blur-sm",
      heroTitleGradient: "bg-gradient-to-r from-purple-600 to-pink-600",
      heroTitle: "Welcome back",
      heroSubtitle: "Sign in to continue setting up your account",
      infoTitle: "Next steps",
      infoIcon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      infoItems: [
        "Use the email you were invited with",
        "Enter the temporary password you copied",
        "You will be asked to change your password next",
      ],
      calloutIcon: <Info className="w-8 h-8 mb-3" />,
      calloutBg: "bg-gradient-to-r from-purple-500 to-pink-600",
      calloutTitle: "Tip",
      calloutBody: "If you didn’t copy the password yet, go back and copy it before signing in.",
    }
  }

  if (step === "change") {
    return {
      heroIcon: <Key className="w-8 h-8 text-white" />,
      heroIconBg: "bg-gradient-to-r from-green-500 to-blue-600",
      heroTitleGradient: "bg-gradient-to-r from-green-600 to-blue-600",
      heroTitle: "Secure your account",
      heroSubtitle: "Set a new password to finish setup",
      infoTitle: "Password requirements",
      infoIcon: <Shield className="w-5 h-5 text-green-500" />,
      infoItems: [
        "At least 8 characters",
        "Include upper & lower case letters",
        "Include numbers and a special character",
      ],
      calloutIcon: <Info className="w-8 h-8 mb-3" />,
      calloutBg: "bg-gradient-to-r from-green-500 to-blue-600",
      calloutTitle: "Security first",
      calloutBody: "Choose a strong password you don’t reuse elsewhere.",
    }
  }

  // accept
  return {
    heroIcon: <Mail className="w-8 h-8 text-white" />,
    heroIconBg: "bg-gradient-to-r from-blue-500 to-purple-600",
    heroTitleGradient: "bg-gradient-to-r from-blue-600 to-purple-600",
    heroTitle: "Accept invitation",
    heroSubtitle: "Review your invitation to create your account",
    infoTitle: "What happens next?",
    infoIcon: <Mail className="w-5 h-5 text-blue-500" />,
    infoItems: [
      "Confirm invitation details",
      "Copy your temporary password",
      "Sign in and change your password",
    ],
    calloutIcon: <CheckCircle2 className="w-8 h-8 mb-3" />,
    calloutBg: "bg-gradient-to-r from-blue-500 to-purple-600",
    calloutTitle: "One-time password",
    calloutBody: "You’ll only see the temporary password once, so copy it when shown.",
  }
}

export function InvitationOnboardingShell({
  currentStep,
  title,
  description,
  children,
}: {
  currentStep: InvitationOnboardingStep
  title: ReactNode
  description?: ReactNode
  children: ReactNode
}) {
  const theme = getStepTheme(currentStep)

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="w-full max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="text-center mb-8" variants={itemVariants}>
          <motion.div
            className={
              "inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 " +
              theme.heroIconBg
            }
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            {theme.heroIcon}
          </motion.div>
          <h1
            className={
              "text-4xl font-bold bg-clip-text text-transparent mb-2 " +
              theme.heroTitleGradient
            }
          >
            {theme.heroTitle}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{theme.heroSubtitle}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <motion.div className="space-y-6" variants={itemVariants}>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                {theme.infoIcon}
                {theme.infoTitle}
              </h3>
              <ul className="space-y-3">
                {theme.infoItems.map((item, index) => (
                  <motion.li
                    key={item}
                    className="flex items-center gap-3 text-gray-700"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </div>

            <motion.div
              className={"rounded-2xl p-6 text-white " + theme.calloutBg}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {theme.calloutIcon}
              <h3 className="text-lg font-semibold mb-2">{theme.calloutTitle}</h3>
              <p className="text-white/80">{theme.calloutBody}</p>
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-xl">
              <CardHeader className="space-y-1 pb-4">
                <div className="pb-2">
                  <InvitationOnboardingStepper currentStep={currentStep} showDescription={false} />
                </div>
                <CardTitle className="text-2xl font-bold text-center">{title}</CardTitle>
                {description ? (
                  <CardDescription className="text-center">{description}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent>{children}</CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
