import { z } from "zod"

export const universityConfigSchema = z.object({
  city: z
    .string()
    .trim()
    .min(1, { message: "City is required." })
    .max(80, { message: "City is too long." }),
  region: z.string().trim().max(80, { message: "Region is too long." }),
  country: z
    .string()
    .trim()
    .min(1, { message: "Country is required." })
    .max(80, { message: "Country is too long." }),
  phone: z.string().trim().max(40, { message: "Phone is too long." }),
  website: z
    .string()
    .trim()
    .max(200, { message: "Website is too long." })
    .refine(
      (value) => value.length === 0 || z.string().url().safeParse(value).success,
      { message: "Website must be a valid URL." }
    ),
})

export type UniversityConfigFormValues = z.infer<typeof universityConfigSchema>
