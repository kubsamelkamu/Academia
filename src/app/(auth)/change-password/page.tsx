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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InvitationOnboardingStepper } from "@/components/auth/invitation-onboarding-stepper"
import { InvitationOnboardingShell } from "@/components/auth/invitation-onboarding-shell"
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

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

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
      <InvitationOnboardingShell
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
                  className="pr-10"
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
                  className="pr-10"
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
                  className="pr-10"
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

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? "Updating password..."
                : user?.mustChangePassword
                  ? "Set new password"
                  : "Change password"}
            </Button>
          </form>
        </div>
      </InvitationOnboardingShell>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="w-full max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div
          className="text-center mb-8"
          variants={itemVariants}
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl mb-4"
            whileHover={{ scale: 1.05, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Key className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            {user?.mustChangePassword ? "Set New Password" : "Change Password"}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {user?.mustChangePassword
              ? "Your temporary password needs to be updated for security"
              : "Update your password to keep your account secure"}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Info Section */}
          <motion.div
            className="space-y-6"
            variants={itemVariants}
          >
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                Password Requirements
              </h3>
              <ul className="space-y-3">
                {[
                  "At least 8 characters long",
                  "Include uppercase letters (A-Z)",
                  "Include lowercase letters (a-z)",
                  "Include numbers (0-9)",
                  "Special characters for extra security"
                ].map((req, index) => (
                  <motion.li
                    key={index}
                    className="flex items-center gap-3 text-gray-700"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {req}
                  </motion.li>
                ))}
              </ul>
            </div>

            <motion.div
              className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-6 text-white"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Info className="w-8 h-8 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Security First</h3>
              <p className="text-green-100">
                A strong password is your first line of defense. Make sure it&apos;s unique and not used elsewhere.
              </p>
            </motion.div>
          </motion.div>

          {/* Main Card */}
          <motion.div variants={itemVariants}>
            <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-xl">
              <CardHeader className="space-y-1 pb-4">
                {isInviteFlow ? (
                  <div className="pb-2">
                    <InvitationOnboardingStepper currentStep="change" />
                  </div>
                ) : null}
                <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                  <Lock className="w-6 h-6 text-green-500" />
                  Update Password
                </CardTitle>
                <CardDescription className="text-center">
                  {user?.mustChangePassword
                    ? "You must change your temporary password before continuing."
                    : "Enter your current password and choose a new one."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex items-center justify-between">
                  <Button 
                    asChild 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <Link href={isInviteFlow ? "/login?from=invite" : "/login"} className="flex items-center gap-2">
                      <ArrowLeft className="w-4 h-4" />
                      Back to login
                    </Link>
                  </Button>
                  {user?.mustChangePassword ? (
                    <Badge variant="destructive" className="bg-red-500">
                      Required
                    </Badge>
                  ) : null}
                </div>

                <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                  {user?.email ? (
                    <motion.div 
                      variants={itemVariants}
                      className="rounded-xl bg-blue-50/50 border border-blue-100 p-4"
                    >
                      <p className="text-sm font-medium text-blue-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-500" />
                        Signed in as
                      </p>
                      <p className="text-sm text-blue-700 mt-1">{user.email}</p>
                      {user.mustChangePassword ? (
                        <Alert className="mt-3 bg-yellow-50 border-yellow-200">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-xs text-yellow-700">
                            Tip: your “current password” is the temporary password you used to log in.
                          </AlertDescription>
                        </Alert>
                      ) : null}
                    </motion.div>
                  ) : null}

                  {/* Current Password */}
                  <motion.div className="space-y-2" variants={itemVariants}>
                    <Label htmlFor="currentPassword" className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-gray-500" />
                      Current Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrent ? "text" : "password"}
                        {...form.register("currentPassword")}
                        placeholder="Enter your current password"
                        className="pr-10 transition-all duration-200 focus:ring-2 focus:ring-green-500/20"
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
                  <motion.div className="space-y-2" variants={itemVariants}>
                    <Label htmlFor="newPassword" className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-gray-500" />
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNew ? "text" : "password"}
                        {...form.register("newPassword")}
                        placeholder="Create a strong password"
                        className="pr-10 transition-all duration-200 focus:ring-2 focus:ring-green-500/20"
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
                    variants={itemVariants}
                    className="rounded-xl bg-gray-50/50 border border-gray-200 p-4 space-y-3"
                  >
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      Password Strength Checklist
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
                          <div className={cn(
                            "w-4 h-4 rounded-full flex items-center justify-center",
                            check.met ? "bg-green-500" : "bg-gray-300"
                          )}>
                            {check.met && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <span className={cn(
                            "text-gray-600",
                            check.met && "text-gray-900 font-medium"
                          )}>
                            {check.label}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Confirm Password */}
                  <motion.div className="space-y-2" variants={itemVariants}>
                    <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-500" />
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        {...form.register("confirmPassword")}
                        placeholder="Re-enter your new password"
                        className={cn(
                          "pr-10 transition-all duration-200 focus:ring-2 focus:ring-green-500/20",
                          confirmPassword && newPassword && confirmPassword === newPassword && "border-green-500 ring-1 ring-green-500",
                          confirmPassword && newPassword && confirmPassword !== newPassword && "border-red-500"
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

                  {/* Submit Button */}
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Updating Password...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          {user?.mustChangePassword ? "Set New Password" : "Change Password"}
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <ChangePasswordPageContent />
    </Suspense>
  )
}