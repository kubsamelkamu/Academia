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
            disabled={updateMutation.isPending}
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
