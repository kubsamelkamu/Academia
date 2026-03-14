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

export const updateMyGroupAnnouncementSchema = z
  .object({
    title: z.string().trim().min(1, "Title cannot be empty").optional(),
    priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
    message: z.string().trim().min(1, "Content cannot be empty").optional(),

    attachmentUrl: z.string().trim().url("Attachment URL must be a valid URL").optional(),
    removeAttachment: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const ops = Number(Boolean(data.attachmentUrl)) + Number(Boolean(data.removeAttachment))
    if (ops > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose only one attachment operation: attachmentUrl or removeAttachment",
      })
    }

    const hasAnyUpdate =
      data.title !== undefined ||
      data.priority !== undefined ||
      data.message !== undefined ||
      ops === 1

    if (!hasAnyUpdate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "No updates provided",
      })
    }
  })

export type CreateMyGroupAnnouncementInput = z.infer<typeof createMyGroupAnnouncementSchema>
export type UpdateMyGroupAnnouncementInput = z.infer<typeof updateMyGroupAnnouncementSchema>
