import { z } from "zod"

export const departmentGroupSizeSchema = z
  .object({
    minGroupSize: z
      .number({ message: "Minimum group size is required" })
      .int("Minimum group size must be an integer")
      .min(1, "Minimum group size must be at least 1"),
    maxGroupSize: z
      .number({ message: "Maximum group size is required" })
      .int("Maximum group size must be an integer")
      .min(1, "Maximum group size must be at least 1"),
  })
  .refine((values) => values.minGroupSize <= values.maxGroupSize, {
    message: "Minimum group size must be less than or equal to maximum group size",
    path: ["maxGroupSize"],
  })

export type DepartmentGroupSizeFormValues = z.infer<typeof departmentGroupSizeSchema>
