import { z } from "zod"

const technologySchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, "Technology is required")
  .refine((value) => value.length <= 50, "Technology must be 50 characters or less")

export const createProjectGroupSchema = z.object({
  name: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, "Group name is required")
    .refine((value) => value.length <= 255, "Group name must be 255 characters or less"),
  objectives: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, "Objectives are required")
    .refine((value) => value.length <= 2000, "Objectives must be 2000 characters or less"),
  technologies: z
    .array(technologySchema)
    .min(1, "At least one technology is required")
    .max(50, "Technologies must be 50 items or fewer"),
})

export function parseTechnologiesInput(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}
