"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import {
  useUniversityConfig,
  useUploadUniversityLogo,
  useUpdateUniversityConfig,
} from "@/lib/hooks/use-university-config"
import {
  universityConfigSchema,
  type UniversityConfigFormValues,
} from "@/validations/university"

function normalizePatchField(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed.length === 0 ? undefined : trimmed
}

export function UniversitySettingsForm() {
  const universityQuery = useUniversityConfig()
  const updateMutation = useUpdateUniversityConfig()
  const uploadLogoMutation = useUploadUniversityLogo()

  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)
  const [logoFile, setLogoFile] = React.useState<File | null>(null)

  const currentLogoUrl = universityQuery.data?.config?.branding?.logoUrl ?? null

  const allowedLogoMimeTypes = React.useMemo(
    () => new Set(["image/jpeg", "image/png", "image/webp"]),
    []
  )
  const maxLogoBytes = 5 * 1024 * 1024

  const form = useForm<UniversityConfigFormValues>({
    resolver: zodResolver(universityConfigSchema),
    defaultValues: {
      city: "",
      region: "",
      country: "",
      phone: "",
      website: "",
    },
    mode: "onBlur",
  })

  React.useEffect(() => {
    if (!universityQuery.data) return

    const address = universityQuery.data.config?.address

    form.reset({
      city: address?.city ?? "",
      region: address?.region ?? "",
      country: address?.country ?? "",
      phone: address?.phone ?? "",
      website: address?.website ?? "",
    })
  }, [form, universityQuery.data])

  const onSubmit = async (values: UniversityConfigFormValues) => {
    try {
      await updateMutation.mutateAsync({
        city: normalizePatchField(values.city),
        region: normalizePatchField(values.region),
        country: normalizePatchField(values.country),
        phone: normalizePatchField(values.phone),
        website: normalizePatchField(values.website),
      })
      toast.success("University settings updated.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update university settings")
    }
  }

  const handlePickLogoFile = (file: File | null) => {
    if (!file) return

    if (!allowedLogoMimeTypes.has(file.type)) {
      toast.error("Logo must be a JPEG, PNG, or WEBP image")
      return
    }

    if (file.size > maxLogoBytes) {
      toast.error("Logo must be 5MB or less")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setLogoPreview(typeof reader.result === "string" ? reader.result : null)
      setLogoFile(file)
    }
    reader.readAsDataURL(file)
  }

  const uploadLogo = async () => {
    if (!logoFile) {
      toast.error("Please select a logo file first")
      return
    }

    try {
      await uploadLogoMutation.mutateAsync(logoFile)
      toast.success("University logo updated.")
      setLogoFile(null)
      setLogoPreview(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload logo")
    }
  }

  if (universityQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (universityQuery.isError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">{universityQuery.error.message}</p>
        <Button type="button" variant="outline" onClick={() => universityQuery.refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">University Logo</h3>
            <p className="text-xs text-muted-foreground">PNG, JPG, or WEBP • 5MB max</p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="h-16 w-16 overflow-hidden rounded-md border bg-background">
              {logoPreview || currentLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview ?? currentLogoUrl ?? ""}
                  alt="University logo"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  No logo
                </div>
              )}
            </div>

            <div className="space-y-2">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                id="university-logo-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  handlePickLogoFile(file)
                  // Allow selecting the same file again
                  e.currentTarget.value = ""
                }}
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("university-logo-upload")?.click()}
                  disabled={uploadLogoMutation.isPending || updateMutation.isPending}
                >
                  Choose file
                </Button>
                <Button
                  type="button"
                  onClick={uploadLogo}
                  disabled={!logoFile || uploadLogoMutation.isPending || updateMutation.isPending}
                >
                  {uploadLogoMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading
                    </span>
                  ) : (
                    "Upload"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormItem className="md:col-span-2">
            <FormLabel>University Name</FormLabel>
            <FormControl>
              <Input value={universityQuery.data?.name ?? ""} disabled />
            </FormControl>
          </FormItem>

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Addis Ababa"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Region</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Oromia"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="Ethiopia" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+251-11-123-4567"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://www.aau.edu.et"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => universityQuery.refetch()}
            disabled={updateMutation.isPending || uploadLogoMutation.isPending}
          >
            Refresh
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
