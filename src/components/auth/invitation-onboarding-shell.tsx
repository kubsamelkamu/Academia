'use client'

import type { ReactNode } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { CheckCircle2, Info, Key, Mail, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InvitationOnboardingStepper, type InvitationOnboardingStep } from "@/components/auth/invitation-onboarding-stepper"
import { AuthTiltCard } from "@/components/auth/auth-tilt-card"
import {
  AUTH_CTA_CARD_CLASS,
  AUTH_GLASS_FORM,
  AUTH_GLASS_PANEL,
  AUTH_GREEN_HEADLINE_CLASS,
  AUTH_WELCOME_HEADLINE_CLASS,
  SIGN_IN_LOGO_SURFACE,
  SIGN_IN_MAGIC_AURA,
  SIGN_IN_MAGIC_CARD_SHELL,
  SIGN_IN_MAGIC_HOVER,
  SIGN_IN_MAGIC_SHINE,
} from "@/components/auth/auth-campus-backdrop"
import { cn } from "@/lib/utils"

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
      heroIconBg: "",
      heroTitleGradient: "bg-gradient-to-r from-sky-100 to-white",
      heroTitle: "Welcome back",
      heroSubtitle: "Sign in to continue setting up your account",
      infoTitle: "Next steps",
      infoIcon: <CheckCircle2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
      infoItems: [
        "Use the email you were invited with",
        "Enter the temporary password you copied",
        "You will be asked to change your password next",
      ],
      calloutIcon: <Info className="w-8 h-8 mb-3" />,
      calloutBg:
        "border border-white/35 bg-sky-800/82 text-white backdrop-blur-xl shadow-lg shadow-sky-950/20 dark:bg-sky-900/75",
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
  centerVertically = true,
  withGlassStyle = false,
}: {
  currentStep: InvitationOnboardingStep
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  /** When false, outer shell does not use min-h-screen (e.g. inside a full-bleed campus backdrop). */
  centerVertically?: boolean
  /** Frosted panels + form card for use on the campus sign-in background. */
  withGlassStyle?: boolean
}) {
  const theme = getStepTheme(currentStep)

  const infoPanelClass = withGlassStyle
    ? cn(AUTH_GLASS_PANEL, "p-6")
    : "rounded-2xl border border-white/20 bg-white/60 p-6 backdrop-blur-sm"

  const calloutClass = withGlassStyle
    ? currentStep === "login"
      ? cn(AUTH_CTA_CARD_CLASS, "rounded-2xl p-6")
      : cn(
          theme.calloutBg,
          "rounded-2xl p-6",
          "hover:border-teal-300/35 hover:shadow-[0_20px_48px_-12px_rgba(20,184,166,0.2),0_20px_48px_-12px_rgba(0,0,0,0.25)]"
        )
    : cn("rounded-2xl p-6 text-white", theme.calloutBg)

  const loginGlassHero = Boolean(withGlassStyle && currentStep === "login")

  const infoPanelInner = (
    <>
      <h3
        className={cn(
          "mb-4 flex items-center gap-2 text-lg font-semibold",
          withGlassStyle ? "text-slate-900 dark:text-slate-100" : "text-gray-900"
        )}
      >
        {theme.infoIcon}
        {theme.infoTitle}
      </h3>
      <ul className="space-y-3">
        {theme.infoItems.map((item, index) => (
          <motion.li
            key={item}
            className={cn(
              "flex items-center gap-3",
              withGlassStyle ? "text-slate-700 dark:text-slate-200" : "text-gray-700"
            )}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <CheckCircle2
              className={cn(
                "h-4 w-4 flex-shrink-0",
                        currentStep === "login" && "text-sky-600 dark:text-sky-400",
                currentStep === "change" && "text-green-600",
                currentStep === "accept" && "text-blue-500"
              )}
            />
            {item}
          </motion.li>
        ))}
      </ul>
    </>
  )

  return (
    <div
      className={cn(
        "w-full px-4 py-8 sm:px-6 lg:px-8",
        centerVertically && "flex min-h-screen items-center justify-center py-12"
      )}
    >
      <motion.div
        className="mx-auto w-full max-w-5xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="mb-8 text-center" variants={itemVariants}>
          <motion.div
            className={cn(
              "mb-4 inline-flex h-16 w-16 items-center justify-center overflow-hidden",
              currentStep === "login"
                ? cn(loginGlassHero ? "rounded-full" : "rounded-2xl", SIGN_IN_LOGO_SURFACE)
                : cn("rounded-2xl", theme.heroIconBg)
            )}
            whileHover={{ scale: 1.05, rotate: currentStep === "login" ? 0 : 5 }}
            whileTap={{ scale: 0.95 }}
          >
            {theme.heroIcon}
          </motion.div>
          <h1
            className={cn(
              "mb-2 text-3xl font-bold tracking-tight sm:text-4xl",
              withGlassStyle
                ? AUTH_WELCOME_HEADLINE_CLASS
                : currentStep === "login"
                  ? AUTH_GREEN_HEADLINE_CLASS
                  : cn("bg-clip-text text-transparent", theme.heroTitleGradient)
            )}
          >
            {theme.heroTitle}
          </h1>
          <p
            className={cn(
              "mx-auto max-w-2xl text-lg sm:text-xl",
              withGlassStyle ? "text-slate-600" : "text-gray-600"
            )}
          >
            {theme.heroSubtitle}
          </p>
        </motion.div>

        <div className="grid items-start gap-8 lg:grid-cols-2">
          <motion.div className="order-2 space-y-6 lg:order-1" variants={itemVariants}>
            {withGlassStyle ? (
              <AuthTiltCard>
                <motion.div
                  className={cn(SIGN_IN_MAGIC_CARD_SHELL, infoPanelClass)}
                  whileHover={SIGN_IN_MAGIC_HOVER}
                >
                  <div className={SIGN_IN_MAGIC_AURA} aria-hidden />
                  <div className="relative z-[1]">{infoPanelInner}</div>
                  <div className={SIGN_IN_MAGIC_SHINE} aria-hidden />
                </motion.div>
              </AuthTiltCard>
            ) : (
              <div className={infoPanelClass}>{infoPanelInner}</div>
            )}

            {withGlassStyle ? (
              <AuthTiltCard>
                <motion.div
                  className={cn(SIGN_IN_MAGIC_CARD_SHELL, calloutClass)}
                  whileHover={SIGN_IN_MAGIC_HOVER}
                >
                  <div className={SIGN_IN_MAGIC_AURA} aria-hidden />
                  <div className="relative z-[1]">
                    {theme.calloutIcon}
                    <h3 className="mb-2 text-lg font-semibold">{theme.calloutTitle}</h3>
                    <p className="text-white/90">{theme.calloutBody}</p>
                  </div>
                  <div className={SIGN_IN_MAGIC_SHINE} aria-hidden />
                </motion.div>
              </AuthTiltCard>
            ) : (
              <motion.div
                className={calloutClass}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {theme.calloutIcon}
                <h3 className="mb-2 text-lg font-semibold">{theme.calloutTitle}</h3>
                <p className="text-white/80">{theme.calloutBody}</p>
              </motion.div>
            )}
          </motion.div>

          <motion.div className="order-1 lg:order-2" variants={itemVariants}>
            {withGlassStyle ? (
              <AuthTiltCard>
                <motion.div className={SIGN_IN_MAGIC_CARD_SHELL} whileHover={SIGN_IN_MAGIC_HOVER}>
                  <div className={SIGN_IN_MAGIC_AURA} aria-hidden />
                  <Card
                    className={cn(
                      AUTH_GLASS_FORM,
                      "relative z-[1] gap-0 border-0 py-6 shadow-2xl ring-0"
                    )}
                  >
                    <CardHeader className="space-y-1 pb-4">
                      <div className="pb-2">
                        <InvitationOnboardingStepper currentStep={currentStep} showDescription={false} />
                      </div>
                      <CardTitle className="text-2xl font-bold text-center">{title}</CardTitle>
                      {description ? (
                        <CardDescription className="text-center text-slate-600 dark:text-slate-300">
                          {description}
                        </CardDescription>
                      ) : null}
                    </CardHeader>
                    <CardContent>{children}</CardContent>
                  </Card>
                  <div className={SIGN_IN_MAGIC_SHINE} aria-hidden />
                </motion.div>
              </AuthTiltCard>
            ) : (
              <Card
                className="border-white/20 bg-white/80 shadow-xl backdrop-blur-sm"
              >
                <CardHeader className="space-y-1 pb-4">
                  <div className="pb-2">
                    <InvitationOnboardingStepper currentStep={currentStep} showDescription={false} />
                  </div>
                  <CardTitle className="text-2xl font-bold text-center">{title}</CardTitle>
                  {description ? (
                    <CardDescription className="text-center text-slate-600 dark:text-slate-300">
                      {description}
                    </CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent>{children}</CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
