"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Cropper, { type Area } from "react-easy-crop"
import { Eye, EyeOff } from "lucide-react"
import { QRCodeCanvas } from "qrcode.react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { cropImageToBlob, type PixelCropArea } from "@/lib/crop-image"
import { useAuthStore } from "@/store/auth-store"

const accountFormSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: "First name is required." })
    .max(50, { message: "First name must not be longer than 50 characters." }),
  lastName: z
    .string()
    .min(1, { message: "Last name is required." })
    .max(50, { message: "Last name must not be longer than 50 characters." }),
})

type AccountFormValues = z.infer<typeof accountFormSchema>

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, { message: "Current password is required." }),
    newPassword: z.string().min(8, { message: "New password must be at least 8 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

type ChangePasswordValues = z.infer<typeof changePasswordSchema>

type TwoFactorSetup = {
  label: string
  secret: string
  otpauthUrl: string
}

function initials(firstName?: string | null, lastName?: string | null) {
  const first = (firstName ?? "").trim().slice(0, 1)
  const last = (lastName ?? "").trim().slice(0, 1)
  const value = `${first}${last}`.toUpperCase()
  return value || "U"
}

function randomBackupCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const part = (len: number) =>
    Array.from({ length: len }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("")
  return `${part(4)}-${part(4)}`
}

function generateBackupCodes(count: number): string[] {
  return Array.from({ length: count }, () => randomBackupCode())
}

function generateTwoFactorSecret(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  const raw = Array.from({ length: 16 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("")
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`
}

function buildOtpAuthUrl({ email, secret }: { email: string; secret: string }): TwoFactorSetup {
  const issuer = "Academia"
  const normalizedSecret = secret.replace(/-/g, "")
  const label = `${issuer}:${email || "user"}`
  const otpauthUrl = `otpauth://totp/${encodeURIComponent(label)}?secret=${encodeURIComponent(
    normalizedSecret
  )}&issuer=${encodeURIComponent(issuer)}`

  return {
    label,
    secret,
    otpauthUrl,
  }
}

export function ProfileSettings() {
  const user = useAuthStore((s) => s.user)
  const profileIsLoading = useAuthStore((s) => s.profileIsLoading)
  const profileError = useAuthStore((s) => s.profileError)
  const fetchProfile = useAuthStore((s) => s.fetchProfile)
  const updateProfileName = useAuthStore((s) => s.updateProfileName)
  const uploadProfileAvatar = useAuthStore((s) => s.uploadProfileAvatar)
  const deleteProfileAvatar = useAuthStore((s) => s.deleteProfileAvatar)
  const changePassword = useAuthStore((s) => s.changePassword)

  const email = user?.email ?? "head@university.edu"

  const avatarUrl = user?.avatarUrl ?? null

  const [selectedImage, setSelectedImage] = React.useState<string | null>(null)
  const [showCropModal, setShowCropModal] = React.useState(false)
  const [avatarCrop, setAvatarCrop] = React.useState({ x: 0, y: 0 })
  const [avatarZoom, setAvatarZoom] = React.useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<PixelCropArea | null>(null)
  const [cropPreviewUrl, setCropPreviewUrl] = React.useState<string | null>(null)
  const [isSavingAvatar, setIsSavingAvatar] = React.useState(false)

  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false)
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState<boolean>(!!user?.twoFactorEnabled)
  const [twoFactorVerifiedAt, setTwoFactorVerifiedAt] = React.useState<string | null>(user?.twoFactorVerifiedAt ?? null)
  const [twoFactorSetup, setTwoFactorSetup] = React.useState<TwoFactorSetup | null>(null)
  const [twoFactorLoading, setTwoFactorLoading] = React.useState(false)
  const [twoFactorError, setTwoFactorError] = React.useState<string | null>(null)

  const [backupCodesRemaining, setBackupCodesRemaining] = React.useState<number | null>(null)
  const [backupCodesLastGenerated, setBackupCodesLastGenerated] = React.useState<string[] | null>(null)
  const [backupCodesDialogOpen, setBackupCodesDialogOpen] = React.useState(false)

  const [verifyCode, setVerifyCode] = React.useState("")

  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
    },
  })

  React.useEffect(() => {
    // Best-effort refresh (keeps profile up to date when this page is opened).
    fetchProfile().catch(() => {
      // store already captures profileError
    })
  }, [fetchProfile])

  React.useEffect(() => {
    accountForm.reset({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.firstName, user?.lastName])

  React.useEffect(() => {
    if (!backupCodesLastGenerated?.length) return
    setBackupCodesDialogOpen(true)
  }, [backupCodesLastGenerated])

  // Avatar object URLs are managed by the backend (remote URL). No local blob URLs retained.

  const onCropComplete = React.useCallback((_: Area, cropped: Area) => {
    setCroppedAreaPixels({
      x: Math.round(cropped.x),
      y: Math.round(cropped.y),
      width: Math.round(cropped.width),
      height: Math.round(cropped.height),
    })
  }, [])

  React.useEffect(() => {
    let active = true
    let previousUrl: string | null = null

    async function buildPreview() {
      if (!selectedImage || !croppedAreaPixels) {
        if (cropPreviewUrl) setCropPreviewUrl(null)
        return
      }

      try {
        const blob = await cropImageToBlob(selectedImage, croppedAreaPixels, {
          outputSize: 128,
          mimeType: "image/jpeg",
          quality: 0.85,
        })
        const url = URL.createObjectURL(blob)
        previousUrl = url
        if (active) setCropPreviewUrl(url)
      } catch {
        // Best-effort preview.
      }
    }

    buildPreview()

    return () => {
      active = false
      if (previousUrl) URL.revokeObjectURL(previousUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImage, croppedAreaPixels])

  async function handleSaveProfile(values: AccountFormValues) {
    try {
      await updateProfileName({ firstName: values.firstName, lastName: values.lastName })
      toast.success("Name updated")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update profile")
    }
  }

  const handleSaveCroppedAvatar = async () => {
    if (!selectedImage || !croppedAreaPixels) {
      toast.message("Adjust the image before saving")
      return
    }

    try {
      setIsSavingAvatar(true)
      const blob = await cropImageToBlob(selectedImage, croppedAreaPixels, {
        outputSize: 256,
        mimeType: "image/jpeg",
        quality: 0.9,
      })

      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" })
      await uploadProfileAvatar(file)

      setShowCropModal(false)
      setSelectedImage(null)
      setCroppedAreaPixels(null)
      setCropPreviewUrl(null)

      toast.success("Avatar updated")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update avatar")
    } finally {
      setIsSavingAvatar(false)
    }
  }

  async function handleChangePassword(values: ChangePasswordValues) {
    if (values.currentPassword === values.newPassword) {
      toast.message("New password must be different from current password")
      return
    }

    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      toast.success("Password changed")
      changePasswordForm.reset()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to change password"
      toast.error(message)
    }
  }

  const changePasswordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function copyToClipboard(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(successMessage)
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }

  async function handleCopyAllBackupCodes() {
    if (!backupCodesLastGenerated?.length) return
    await copyToClipboard(backupCodesLastGenerated.join("\n"), "Backup codes copied.")
  }

  function enableTwoFactor() {
    setTwoFactorError(null)
    setTwoFactorLoading(true)

    window.setTimeout(() => {
      const secret = generateTwoFactorSecret()
      setTwoFactorSetup(buildOtpAuthUrl({ email, secret }))
      setTwoFactorLoading(false)
    }, 600)
  }

  function disableTwoFactor() {
    setTwoFactorError(null)
    setTwoFactorLoading(true)

    window.setTimeout(() => {
      setTwoFactorEnabled(false)
      setTwoFactorVerifiedAt(null)
      setTwoFactorSetup(null)
      setVerifyCode("")
      setTwoFactorLoading(false)
      setBackupCodesRemaining(null)
      setBackupCodesLastGenerated(null)
    }, 400)
  }

  function verifyTwoFactor(code: string) {
    setTwoFactorError(null)

    if (!twoFactorSetup) {
      setTwoFactorError("Start setup first.")
      return
    }

    if (!/^\d{6}$/.test(code.trim())) {
      setTwoFactorError("Enter a valid 6-digit code.")
      return
    }

    setTwoFactorLoading(true)
    window.setTimeout(() => {
      setTwoFactorEnabled(true)
      setTwoFactorVerifiedAt(new Date().toISOString())
      setTwoFactorSetup(null)
      setVerifyCode("")
      setTwoFactorLoading(false)
      setBackupCodesRemaining(10)
    }, 700)
  }

  async function generateCodes() {
    setTwoFactorError(null)
    setTwoFactorLoading(true)

    window.setTimeout(() => {
      const codes = generateBackupCodes(10)
      setBackupCodesLastGenerated(codes)
      setBackupCodesRemaining(10)
      setTwoFactorLoading(false)
    }, 600)
  }

  async function regenerateCodes() {
    setTwoFactorError(null)
    setTwoFactorLoading(true)

    window.setTimeout(() => {
      const codes = generateBackupCodes(10)
      setBackupCodesLastGenerated(codes)
      setBackupCodesRemaining(10)
      setTwoFactorLoading(false)
    }, 600)
  }

  const currentInitials = initials(accountForm.getValues("firstName"), accountForm.getValues("lastName"))

  return (
    <div className="space-y-10">
      {profileError ? <p className="text-sm text-destructive">{profileError}</p> : null}

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Account</h3>
          <p className="text-sm text-muted-foreground">Update your name and profile picture.</p>
        </div>

        <Form {...accountForm}>
          <form onSubmit={accountForm.handleSubmit(handleSaveProfile)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={accountForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your first name" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={accountForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your last name" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">Signed in as: {email}</div>
              <Button type="submit" disabled={profileIsLoading}>Update profile</Button>
            </div>
          </form>
        </Form>

        <div className="h-px w-full bg-border" />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Profile Picture</h3>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <Avatar className="h-20 w-20">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="Avatar" /> : null}
              <AvatarFallback className="text-lg">{currentInitials}</AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="avatar-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (!file.type.startsWith("image/")) {
                      toast.error("Please select an image file")
                      e.currentTarget.value = ""
                      return
                    }

                    const maxBytes = 1 * 1024 * 1024
                    if (file.size > maxBytes) {
                      toast.error("Image must be 1MB or less")
                      e.currentTarget.value = ""
                      return
                    }

                    const reader = new FileReader()
                    reader.onload = () => {
                      setSelectedImage(reader.result as string)
                      setAvatarCrop({ x: 0, y: 0 })
                      setAvatarZoom(1)
                      setCroppedAreaPixels(null)
                      setCropPreviewUrl(null)
                      setShowCropModal(true)
                    }
                    reader.readAsDataURL(file)
                  }

                  // Allow selecting the same file again
                  e.currentTarget.value = ""
                }}
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => document.getElementById("avatar-upload")?.click()}
                  disabled={profileIsLoading || isSavingAvatar}
                >
                  Upload new picture
                </Button>
                {avatarUrl ? (
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      deleteProfileAvatar()
                        .then(() => {
                            toast.success("Avatar removed")
                        })
                        .catch((e: unknown) => {
                            toast.error(e instanceof Error ? e.message : "Failed to delete avatar")
                        })
                    }}
                    disabled={profileIsLoading || isSavingAvatar}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>

              <p className="text-sm text-muted-foreground">JPG, GIF or PNG. 1MB max.</p>
            </div>
          </div>
        </div>

        <Dialog
          open={showCropModal}
          onOpenChange={(open) => {
            setShowCropModal(open)
            if (!open) {
              setSelectedImage(null)
              setAvatarCrop({ x: 0, y: 0 })
              setAvatarZoom(1)
              setCroppedAreaPixels(null)
              setCropPreviewUrl(null)
            }
          }}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Crop avatar</DialogTitle>
              <DialogDescription>
                Drag to reposition and use the zoom slider. This will be saved as a square image and displayed as a circle.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedImage ? (
                <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                  <div className="relative h-[360px] w-full overflow-hidden rounded-md bg-muted">
                    <Cropper
                      image={selectedImage}
                      crop={avatarCrop}
                      zoom={avatarZoom}
                      aspect={1}
                      cropShape="round"
                      showGrid={false}
                      onCropChange={setAvatarCrop}
                      onZoomChange={setAvatarZoom}
                      onCropComplete={onCropComplete}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm">Preview</Label>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="relative h-20 w-20 overflow-hidden rounded-full bg-muted">
                          {cropPreviewUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cropPreviewUrl} alt="Avatar preview" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">This is how it will look.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Zoom</Label>
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.01}
                        value={avatarZoom}
                        onChange={(e) => setAvatarZoom(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCropModal(false)}
                  disabled={isSavingAvatar}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveCroppedAvatar}
                  disabled={!selectedImage || !croppedAreaPixels || isSavingAvatar}
                >
                  {isSavingAvatar ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="h-px w-full bg-border" />

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Change Password</h3>
          <p className="text-sm text-muted-foreground">Update your password (stubbed for now).</p>
        </div>

        <Form {...changePasswordForm}>
          <form
            onSubmit={changePasswordForm.handleSubmit(handleChangePassword)}
            className="space-y-5 max-w-md"
          >
            <FormField
              control={changePasswordForm.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showCurrentPassword ? "text" : "password"}
                        autoComplete="current-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={changePasswordForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showNewPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={changePasswordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={changePasswordForm.formState.isSubmitting}>
              {changePasswordForm.formState.isSubmitting ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </Form>
      </div>

      <div className="h-px w-full bg-border" />

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Two-Factor Authentication (2FA)</h3>
          <p className="text-sm text-muted-foreground">UI only for now — endpoints can be wired later.</p>
        </div>

        <div className="flex flex-col gap-4 max-w-md">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="font-medium">Two-Factor Authentication (2FA)</div>
              <div className="text-sm text-muted-foreground">
                {twoFactorEnabled ? "2FA is enabled." : "2FA is currently disabled."}
                {twoFactorEnabled && twoFactorVerifiedAt
                  ? ` Verified at: ${new Date(twoFactorVerifiedAt).toLocaleString()}`
                  : ""}
              </div>
            </div>

            {twoFactorEnabled ? (
              <Button variant="destructive" type="button" onClick={disableTwoFactor} disabled={twoFactorLoading}>
                {twoFactorLoading ? "Disabling..." : "Disable"}
              </Button>
            ) : (
              <Button type="button" onClick={enableTwoFactor} disabled={twoFactorLoading}>
                {twoFactorLoading ? "Enabling..." : "Enable"}
              </Button>
            )}
          </div>

          {twoFactorError ? <p className="text-destructive text-sm">{twoFactorError}</p> : null}

          {!twoFactorEnabled && !twoFactorSetup && !twoFactorLoading ? (
            <div className="rounded-md border p-4 bg-muted/50">
              <div className="text-sm text-muted-foreground">
                Enable 2FA to add an extra layer of security to your account.
              </div>
            </div>
          ) : null}

          {!twoFactorEnabled && twoFactorLoading && !twoFactorSetup ? (
            <div className="rounded-md border p-4 space-y-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
              <div className="animate-pulse">
                <div className="h-44 w-44 bg-muted rounded" />
              </div>
            </div>
          ) : null}

          {!twoFactorEnabled && twoFactorSetup ? (
            <div className="rounded-md border p-4 space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Set up 2FA</div>
                <div className="text-sm text-muted-foreground">Follow these steps to enable two-factor authentication.</div>

                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                      1
                    </div>
                    <span>Scan the QR code with your authenticator app</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-medium">
                      2
                    </div>
                    <span>Enter the verification code below</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-md border bg-background p-3">
                  <QRCodeCanvas value={twoFactorSetup.otpauthUrl} size={176} includeMargin level="M" />
                </div>

                <div className="flex-1 space-y-3">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Label</div>
                    <div className="text-sm break-words">{twoFactorSetup.label}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Secret</div>
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-sm break-all">{twoFactorSetup.secret}</div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(twoFactorSetup.secret, "Secret copied.")}
                      >
                        Copy
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">If you can’t scan the QR code, enter this secret manually.</div>
                  </div>
                </div>
              </div>

              <div className="rounded-md bg-muted p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-xs text-muted-foreground">otpauthUrl</div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(twoFactorSetup.otpauthUrl, "Setup link copied.")}
                  >
                    Copy link
                  </Button>
                </div>
                <div className="break-all text-xs font-mono">{twoFactorSetup.otpauthUrl}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verifyCode" className="text-sm font-medium">
                  Verification Code
                </Label>
                <Input
                  id="verifyCode"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 6-digit code from app"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={twoFactorLoading}
                  maxLength={6}
                />
                <div className="text-xs text-muted-foreground">
                  Codes are time-sensitive. If invalid, check your device time sync.
                </div>
              </div>

              <Button
                variant="secondary"
                type="button"
                onClick={() => verifyTwoFactor(verifyCode)}
                disabled={twoFactorLoading || !verifyCode.trim()}
              >
                {twoFactorLoading ? "Verifying..." : "Verify 2FA Setup"}
              </Button>
            </div>
          ) : null}

          <div className="h-px w-full bg-border" />

          <div className="space-y-2">
            <div className="font-medium">Backup Codes</div>
            <div className="text-sm text-muted-foreground">Remaining codes: {backupCodesRemaining ?? "—"}</div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={generateCodes} disabled={twoFactorLoading || !twoFactorEnabled}>
                Generate
              </Button>
              <Button type="button" variant="outline" onClick={regenerateCodes} disabled={twoFactorLoading || !twoFactorEnabled}>
                Regenerate
              </Button>
            </div>
            {!twoFactorEnabled ? (
              <p className="text-xs text-muted-foreground">Enable and verify 2FA to generate backup codes.</p>
            ) : null}
          </div>

          <Dialog
            open={backupCodesDialogOpen}
            onOpenChange={(open) => {
              setBackupCodesDialogOpen(open)
              if (!open) setBackupCodesLastGenerated(null)
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Backup Codes</DialogTitle>
                <DialogDescription>Store these codes securely. They may not be shown again.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {(backupCodesLastGenerated ?? []).map((code) => (
                    <div key={code} className="rounded-md border px-2 py-1 font-mono text-sm">
                      {code}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={handleCopyAllBackupCodes}>
                    Copy all
                  </Button>
                  <Button type="button" onClick={() => setBackupCodesDialogOpen(false)}>
                    Done
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
