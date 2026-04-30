"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  Eye,
  EyeOff,
  Lock,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Key,
  Info
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InvitationOnboardingShell } from "@/components/auth/invitation-onboarding-shell"
import {
  AuthCampusBackdrop,
  AUTH_ACCENT_ICON,
  AUTH_FORM_INPUT_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  AUTH_WELCOME_HEADLINE_CLASS,
} from "@/components/auth/auth-campus-backdrop"
import {
  AuthTiltCard,
  AUTH_CONTAINER_VARIANTS,
  AUTH_ITEM_VARIANTS,
  AUTH_SLIDE_LEFT_VARIANTS,
  AUTH_SLIDE_RIGHT_VARIANTS,
} from "@/components/auth/auth-tilt-card"
import { useAuthStore } from "@/store/auth-store"
import { cn } from "@/lib/utils"

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(100, "New password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

function ChangePasswordPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const changePassword = useAuthStore((s) => s.changePassword)

  const isInviteFlow = (searchParams.get("from") ?? "") === "invite" || Boolean(user?.mustChangePassword)

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    if (!accessToken && !isLoading) {
      router.replace("/login")
    }
  }, [accessToken, isLoading, router])

  async function onSubmit(values: ChangePasswordFormData) {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })

      // Refresh canonical profile.
      try {
        await useAuthStore.getState().fetchMe()
      } catch {
        // ignore
      }

      toast.success("Password changed successfully!", {
        icon: <CheckCircle2 className="w-4 h-4 text-green-500" />
      })
      router.replace("/dashboard")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to change password")
    }
  }

  const newPassword = useWatch({ control: form.control, name: "newPassword" }) ?? ""
  const confirmPassword = useWatch({ control: form.control, name: "confirmPassword" }) ?? ""

  const passwordStrength = useMemo(() => {
    let strength = 0
    if (newPassword.length >= 8) strength++
    if (/[A-Z]/.test(newPassword)) strength++
    if (/[a-z]/.test(newPassword)) strength++
    if (/[0-9]/.test(newPassword)) strength++
    if (/[^A-Za-z0-9]/.test(newPassword)) strength++
    return Math.min(strength, 3)
  }, [newPassword])

  const checks = useMemo(
    () => ({
      minLength: newPassword.length >= 8,
      hasUppercase: /[A-Z]/.test(newPassword),
      hasLowercase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
      matches:
        confirmPassword.length > 0 && newPassword.length > 0 && newPassword === confirmPassword,
    }),
    [confirmPassword, newPassword]
  )

  const strengthLabel = useMemo(() => {
    if (!newPassword) return "Enter a password"
    if (passwordStrength === 0) return "Very Weak"
    if (passwordStrength === 1) return "Weak"
    if (passwordStrength === 2) return "Medium"
    return "Strong"
  }, [passwordStrength, newPassword])

  const strengthColor = useMemo(() => {
    if (!newPassword) return "bg-gray-200"
    if (passwordStrength === 0) return "bg-red-500"
    if (passwordStrength === 1) return "bg-orange-500"
    if (passwordStrength === 2) return "bg-yellow-500"
    return "bg-green-500"
  }, [passwordStrength, newPassword])

  if (isInviteFlow) {
    return (
      <AuthCampusBackdrop>
        <InvitationOnboardingShell
          centerVertically={false}
          withGlassStyle
          currentStep="change"
          title={user?.mustChangePassword ? "Set a new password" : "Change password"}
          description={
            user?.mustChangePassword
              ? "For security, you must change the temporary password before continuing."
              : "Choose a new password to keep your account secure."
          }
        >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login?from=invite" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </Button>
            {user?.mustChangePassword ? <Badge variant="destructive">Required</Badge> : null}
          </div>

          {user?.email ? (
            <div className="rounded-md border p-4">
              <p className="text-sm font-medium">Signed in as</p>
              <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
              {user.mustChangePassword ? (
                <Alert className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Tip: your “current password” is the temporary password you used to log in.
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>
          ) : null}

          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  {...form.register("currentPassword")}
                  placeholder="Enter your current password"
                  className={cn("pr-12", AUTH_FORM_INPUT_CLASS, "h-12 rounded-xl border-2")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setShowCurrent((v) => !v)}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {form.formState.errors.currentPassword ? (
                <p className="text-sm text-destructive">{form.formState.errors.currentPassword.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  {...form.register("newPassword")}
                  placeholder="Create a strong password"
                  className={cn("pr-12", AUTH_FORM_INPUT_CLASS, "h-12 rounded-xl border-2")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setShowNew((v) => !v)}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>

              {newPassword ? (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-[width] duration-300"
                        style={{ width: `${(passwordStrength / 3) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{strengthLabel}</span>
                  </div>
                </div>
              ) : null}

              {form.formState.errors.newPassword ? (
                <p className="text-sm text-destructive">{form.formState.errors.newPassword.message}</p>
              ) : null}
            </div>

            <div className="rounded-md border p-4 space-y-3">
              <p className="text-sm font-medium">Password checklist</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "8+ characters", met: checks.minLength },
                  { label: "Uppercase", met: checks.hasUppercase },
                  { label: "Lowercase", met: checks.hasLowercase },
                  { label: "Number", met: checks.hasNumber },
                  { label: "Special", met: checks.hasSpecial },
                  { label: "Match", met: checks.matches },
                ].map((check) => (
                  <div key={check.label} className="flex items-center gap-2 text-xs">
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center",
                        check.met ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {check.met ? <CheckCircle2 className="w-3 h-3" /> : null}
                    </div>
                    <span className={cn("text-muted-foreground", check.met && "text-foreground font-medium")}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  {...form.register("confirmPassword")}
                  placeholder="Re-enter your new password"
                  className={cn("pr-12", AUTH_FORM_INPUT_CLASS, "h-12 rounded-xl border-2")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setShowConfirm((v) => !v)}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {form.formState.errors.confirmPassword ? (
                <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
              ) : null}
            </div>

            <Button
              type="submit"
              className={cn(AUTH_PRIMARY_BUTTON_CLASS, "h-14 text-base font-black uppercase tracking-widest")}
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? "Updating password..."
                : user?.mustChangePassword
                  ? "Set new password"
                  : "Change password"}
            </Button>
          </form>
        </div>
        </InvitationOnboardingShell>
      </AuthCampusBackdrop>
    )
  }

  return (
    <AuthCampusBackdrop>
      <motion.div
        className="mx-auto w-full max-w-5xl"
        variants={AUTH_CONTAINER_VARIANTS}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="mb-10 text-center sm:mb-12" variants={AUTH_ITEM_VARIANTS}>
          <motion.div
            className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ED5F45] to-[#F47A64] shadow-lg shadow-[#ED5F45]/30 sm:h-24 sm:w-24"
            whileHover={{ scale: 1.06, rotate: -4 }}
            whileTap={{ scale: 0.94 }}
          >
            <Key className="h-10 w-10 text-white sm:h-11 sm:w-11" />
          </motion.div>
          <h1 className={cn("mb-3 text-4xl sm:text-5xl md:text-6xl", AUTH_WELCOME_HEADLINE_CLASS)}>
            Change password
          </h1>
          <p className="mx-auto max-w-lg text-pretty text-base font-medium text-slate-600 sm:text-lg">
            Update your password to keep your account secure.
          </p>
        </motion.div>

        <div className="grid items-stretch gap-8 lg:grid-cols-[1fr_420px]">
          <motion.div className="order-2 space-y-6 lg:order-1" variants={AUTH_SLIDE_LEFT_VARIANTS}>
            <AuthTiltCard>
              <div className="relative overflow-hidden rounded-[2.5rem] border border-[#ED5F45]/20 bg-slate-950/40 p-8 shadow-2xl backdrop-blur-xl">
                <div className="absolute inset-x-0 top-0 h-1 bg-[#ED5F45] opacity-90" />
                <h3 className="mb-6 flex items-center gap-3 text-lg font-black uppercase tracking-tight text-white sm:text-xl">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ED5F45]/30 bg-[#ED5F45]/20">
                    <Shield className="h-5 w-5 text-[#ED5F45]" />
                  </span>
                  Requirements
                </h3>
                <ul className="space-y-3 text-sm font-medium text-slate-100 sm:text-base">
                  {[
                    "At least 8 characters",
                    "Upper & lowercase letters",
                    "Numbers and special characters",
                  ].map((req, i) => (
                    <motion.li
                      key={req}
                      className="flex gap-3"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.12 + i * 0.06 }}
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#ED5F45]" />
                      {req}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </AuthTiltCard>
            <AuthTiltCard>
              <div className="relative overflow-hidden rounded-[2.5rem] border border-[#ED5F45]/20 bg-gradient-to-br from-[#ED5F45]/10 via-slate-900/40 to-slate-950/80 p-8 text-white backdrop-blur-xl">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ED5F45] via-[#F47A64] to-[#ED5F45] opacity-80" />
                <Info className="mb-3 h-8 w-8 text-[#ED5F45]" />
                <h3 className="mb-2 text-lg font-black uppercase tracking-tight">Security first</h3>
                <p className="text-sm font-medium text-white/85 sm:text-base">
                  Use a unique password you don&apos;t reuse on other sites.
                </p>
              </div>
            </AuthTiltCard>
          </motion.div>

          <motion.div className="order-1 lg:order-2" variants={AUTH_SLIDE_RIGHT_VARIANTS}>
            <AuthTiltCard>
              <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white shadow-2xl backdrop-blur-2xl dark:bg-slate-900">
                <div className="h-1.5 w-full bg-gradient-to-r from-[#ED5F45] via-[#F47A64] to-[#ED5F45]" />
                <div className="px-6 pb-10 pt-8 sm:px-10">
                  <div className="mb-8 text-center">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ED5F45] to-[#F47A64] shadow-lg shadow-[#ED5F45]/30">
                      <Lock className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                      Update password
                    </h2>
                    <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                      Enter your current password and choose a new one.
                    </p>
                  </div>

                  <div className="mb-6 flex items-center justify-between">
                    <Button asChild variant="ghost" size="sm" className="font-bold text-[#ED5F45]">
                      <Link href="/login" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Link>
                    </Button>
                  </div>

                  <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                  {user?.email ? (
                    <motion.div variants={AUTH_ITEM_VARIANTS} className="rounded-xl border border-[#ED5F45]/20 bg-[#ED5F45]/5 p-4">
                      <p className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                        <CheckCircle2 className="h-4 w-4 text-[#ED5F45]" />
                        Signed in as
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">{user.email}</p>
                    </motion.div>
                  ) : null}

                  {/* Current Password */}
                  <motion.div className="space-y-2" variants={AUTH_ITEM_VARIANTS}>
                    <Label
                      htmlFor="currentPassword"
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
                    >
                      <Lock className={cn("h-3.5 w-3.5", AUTH_ACCENT_ICON)} />
                      Current password
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrent ? "text" : "password"}
                        {...form.register("currentPassword")}
                        placeholder="Enter your current password"
                        className={cn("h-12 rounded-xl border-2 pr-12", AUTH_FORM_INPUT_CLASS)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={() => setShowCurrent((v) => !v)}
                      >
                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {form.formState.errors.currentPassword ? (
                      <motion.p
                        className="text-sm text-red-600 flex items-center gap-1"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <AlertCircle className="w-3 h-3" />
                        {form.formState.errors.currentPassword.message}
                      </motion.p>
                    ) : null}
                  </motion.div>

                  {/* New Password */}
                  <motion.div className="space-y-2" variants={AUTH_ITEM_VARIANTS}>
                    <Label
                      htmlFor="newPassword"
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
                    >
                      <Key className={cn("h-3.5 w-3.5", AUTH_ACCENT_ICON)} />
                      New password
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNew ? "text" : "password"}
                        {...form.register("newPassword")}
                        placeholder="Create a strong password"
                        className={cn("h-12 rounded-xl border-2 pr-12", AUTH_FORM_INPUT_CLASS)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={() => setShowNew((v) => !v)}
                      >
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>

                    {/* Password Strength Indicator */}
                    {newPassword && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              className={cn("h-full", strengthColor)}
                              initial={{ width: 0 }}
                              animate={{ width: `${(passwordStrength / 3) * 100}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            {strengthLabel}
                          </span>
                        </div>
                      </div>
                    )}

                    {form.formState.errors.newPassword ? (
                      <motion.p
                        className="text-sm text-red-600 flex items-center gap-1"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <AlertCircle className="w-3 h-3" />
                        {form.formState.errors.newPassword.message}
                      </motion.p>
                    ) : null}
                  </motion.div>

                  {/* Password Checklist */}
                  <motion.div
                    variants={AUTH_ITEM_VARIANTS}
                    className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40"
                  >
                    <p className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                      <Shield className="h-4 w-4 text-[#ED5F45]" />
                      Strength checklist
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "8+ characters", met: checks.minLength },
                        { label: "Uppercase letter", met: checks.hasUppercase },
                        { label: "Lowercase letter", met: checks.hasLowercase },
                        { label: "Number", met: checks.hasNumber },
                        { label: "Special character", met: checks.hasSpecial },
                        { label: "Passwords match", met: checks.matches },
                      ].map((check, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center gap-2 text-xs"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div
                            className={cn(
                              "flex h-4 w-4 items-center justify-center rounded-full",
                              check.met ? "bg-[#ED5F45]" : "bg-slate-300 dark:bg-slate-600"
                            )}
                          >
                            {check.met ? <CheckCircle2 className="h-3 w-3 text-white" /> : null}
                          </div>
                          <span
                            className={cn(
                              "text-slate-600 dark:text-slate-400",
                              check.met && "font-medium text-slate-900 dark:text-slate-100"
                            )}
                          >
                            {check.label}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Confirm Password */}
                  <motion.div className="space-y-2" variants={AUTH_ITEM_VARIANTS}>
                    <Label
                      htmlFor="confirmPassword"
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
                    >
                      <CheckCircle2 className={cn("h-3.5 w-3.5", AUTH_ACCENT_ICON)} />
                      Confirm password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        {...form.register("confirmPassword")}
                        placeholder="Re-enter your new password"
                        className={cn(
                          "h-12 rounded-xl border-2 pr-12",
                          AUTH_FORM_INPUT_CLASS,
                          confirmPassword && newPassword && confirmPassword === newPassword && "border-emerald-500",
                          confirmPassword && newPassword && confirmPassword !== newPassword && "border-destructive"
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={() => setShowConfirm((v) => !v)}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {confirmPassword && newPassword && confirmPassword === newPassword && (
                      <motion.p
                        className="text-xs text-green-600 flex items-center gap-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Passwords match
                      </motion.p>
                    )}
                    {form.formState.errors.confirmPassword ? (
                      <motion.p
                        className="text-sm text-red-600 flex items-center gap-1"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <AlertCircle className="w-3 h-3" />
                        {form.formState.errors.confirmPassword.message}
                      </motion.p>
                    ) : null}
                  </motion.div>

                  <motion.div variants={AUTH_ITEM_VARIANTS}>
                    <Button
                      type="submit"
                      className={cn(AUTH_PRIMARY_BUTTON_CLASS, "h-14 text-base font-black uppercase tracking-widest")}
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? "Updating…" : "Update password"}
                    </Button>
                  </motion.div>
                </form>
                </div>
              </div>
            </AuthTiltCard>
          </motion.div>
        </div>
      </motion.div>
    </AuthCampusBackdrop>
  )
}

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthCampusBackdrop>
          <p className="text-sm font-medium text-slate-600">Loading…</p>
        </AuthCampusBackdrop>
      }
    >
      <ChangePasswordPageContent />
    </Suspense>
  )
}