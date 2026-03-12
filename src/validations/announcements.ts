import { z } from "zod"

export const announcementIdSchema = z.string().uuid("Announcement ID must be a valid UUID")

export const createMyGroupAnnouncementSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    priority: z.enum(["HIGH", "MEDIUM", "LOW"], {
      message: "Priority is required",
    }),
    message: z.string().trim().min(1, "Content is required"),
    attachmentUrl: z.string().trim().url("Attachment URL must be a valid URL").optional(),
  })

export type CreateMyGroupAnnouncementInput = z.infer<typeof createMyGroupAnnouncementSchema>
