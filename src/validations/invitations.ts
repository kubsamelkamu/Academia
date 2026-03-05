import { z } from "zod"

export const invitationRoleNameSchema = z.enum(["Student", "Advisor", "Coordinator"])

export const createInvitationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().trim().min(1, "First name is required").max(50, "First name is too long"),
  lastName: z.string().trim().min(1, "Last name is required").max(50, "Last name is too long"),
  roleName: invitationRoleNameSchema,
  subject: z.string().trim().min(1).max(140, "Subject is too long").optional().or(z.literal("")),
  message: z.string().trim().min(1).max(2000, "Message is too long").optional().or(z.literal("")),
})

export type CreateInvitationFormData = z.infer<typeof createInvitationSchema>

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
})

export type AcceptInvitationFormData = z.infer<typeof acceptInvitationSchema>
