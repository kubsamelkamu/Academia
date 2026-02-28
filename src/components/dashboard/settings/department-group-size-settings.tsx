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
  useDepartmentGroupSizeSettings,
  useUpdateDepartmentGroupSizeSettings,
} from "@/lib/hooks/use-department-group-size-settings"
import {
  departmentGroupSizeSchema,
  type DepartmentGroupSizeFormValues,
} from "@/validations/department-settings"

export function DepartmentGroupSizeSettings() {
  const groupSizeQuery = useDepartmentGroupSizeSettings()
  const updateMutation = useUpdateDepartmentGroupSizeSettings()

  const form = useForm<DepartmentGroupSizeFormValues>({
    resolver: zodResolver(departmentGroupSizeSchema),
    defaultValues: {
      minGroupSize: 3,
      maxGroupSize: 5,
    },
    mode: "onBlur",
  })

  React.useEffect(() => {
    if (!groupSizeQuery.data) return

    form.reset({
      minGroupSize: groupSizeQuery.data.minGroupSize,
      maxGroupSize: groupSizeQuery.data.maxGroupSize,
    })
  }, [form, groupSizeQuery.data])

  const onSubmit = async (values: DepartmentGroupSizeFormValues) => {
    try {
      await updateMutation.mutateAsync(values)
      toast.success("Group size settings updated.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update group size settings")
    }
  }

  if (groupSizeQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (groupSizeQuery.isError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">{groupSizeQuery.error.message}</p>
        <Button type="button" variant="outline" onClick={() => groupSizeQuery.refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="minGroupSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum students per group</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    {...field}
                    value={Number.isFinite(field.value) ? field.value : ""}
                    onChange={(event) => field.onChange(event.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxGroupSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum students per group</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    {...field}
                    value={Number.isFinite(field.value) ? field.value : ""}
                    onChange={(event) => field.onChange(event.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Defaults are 3–5 if no settings exist yet.
          </p>
          <Button type="submit" disabled={updateMutation.isPending || !form.formState.isDirty}>
            {updateMutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving
              </span>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
