"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Cropper, { type Area } from "react-easy-crop"
import { AlertCircle, Camera, Eye, EyeOff, Trash2 } from "lucide-react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

import { cropImageToBlob, type PixelCropArea } from "@/lib/crop-image"
import { getPrimaryRoleFromBackendRoles } from "@/lib/auth/dashboard-role-paths"
import { useAuthStore } from "@/store/auth-store"
import { StudentProfileSection } from "@/components/dashboard/settings/student-profile-section"

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

function initials(firstName?: string | null, lastName?: string | null) {
  const first = (firstName ?? "").trim().slice(0, 1)
  const last = (lastName ?? "").trim().slice(0, 1)
  const value = `${first}${last}`.toUpperCase()
  return value || "U"
}

export function ProfileSettings() {
  const user = useAuthStore((s) => s.user)
  const profileIsLoading = useAuthStore((s) => s.profileIsLoading)
  const profileError = useAuthStore((s) => s.profileError)
  const fetchProfile = useAuthStore((s) => s.fetchProfile)
  const fetchStudentProfile = useAuthStore((s) => s.fetchStudentProfile)
  const updateProfileName = useAuthStore((s) => s.updateProfileName)
  const uploadProfileAvatar = useAuthStore((s) => s.uploadProfileAvatar)
  const deleteProfileAvatar = useAuthStore((s) => s.deleteProfileAvatar)
  const changePassword = useAuthStore((s) => s.changePassword)

  const avatarUrl = user?.avatarUrl ?? null

  const primaryRole = getPrimaryRoleFromBackendRoles(user?.roles)
  const isStudent = primaryRole === "student"

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

  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
    },
  })

  React.useEffect(() => {
    // Best-effort refresh (keeps profile up to date when this page is opened).
    const refresh = isStudent ? fetchStudentProfile : fetchProfile
    refresh().catch(() => {
      // store already captures profileError
    })
  }, [fetchProfile, fetchStudentProfile, isStudent])

  React.useEffect(() => {
    accountForm.reset({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
    })
  }, [user?.firstName, user?.lastName])

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
  }, [selectedImage, croppedAreaPixels])

  async function handleSaveProfile(values: AccountFormValues) {
    if (isStudent) {
      toast.message("Your name is read-only")
      accountForm.reset({
        firstName: user?.firstName ?? "",
        lastName: user?.lastName ?? "",
      })
      return
    }

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

  const currentInitials = initials(accountForm.getValues("firstName"), accountForm.getValues("lastName"))

  return (
    <div className="space-y-8 md:space-y-10 max-w-5xl mx-auto">
      {profileError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{profileError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Update your name and profile picture.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                        <Input
                          placeholder="Your first name"
                          {...field}
                          value={field.value ?? ""}
                          readOnly={isStudent}
                          className="transition-all focus:ring-2 focus:ring-primary"
                        />
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
                        <Input
                          placeholder="Your last name"
                          {...field}
                          value={field.value ?? ""}
                          readOnly={isStudent}
                          className="transition-all focus:ring-2 focus:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  Signed in as: {email}
                </Badge>
                {!isStudent ? (
                  <Button type="submit" disabled={profileIsLoading} className="w-full sm:w-auto">
                    {profileIsLoading ? "Updating..." : "Update profile"}
                  </Button>
                ) : null}
              </div>
            </form>
          </Form>

          <div className="h-px w-full bg-border" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Profile Picture</h3>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <Avatar className="h-24 w-24 shrink-0 ring-2 ring-primary/10">
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
                      className="flex-1 sm:flex-none"
                    >
                      <Camera className="mr-2 h-4 w-4" />
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
                        className="flex-1 sm:flex-none"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    ) : null}
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground">
                    JPG, GIF or PNG. 1MB max. Square images work best for avatars.
                  </p>
                </div>
              </div>

              {getPrimaryRoleFromBackendRoles(user?.roles) === "student" && (
                <div className="rounded-lg border bg-muted/40 p-4">
                  <StudentProfileSection />
                </div>
              )}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Use a strong, unique password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent>
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
                          className="pr-10 transition-all focus:ring-2 focus:ring-primary"
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
                          className="pr-10 transition-all focus:ring-2 focus:ring-primary"
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
                          className="pr-10 transition-all focus:ring-2 focus:ring-primary"
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

              <Button
                type="submit"
                disabled={changePasswordForm.formState.isSubmitting}
                className="w-full sm:w-auto"
              >
                {changePasswordForm.formState.isSubmitting ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}