import { z } from 'zod';

export const DEPARTMENT_NAME_OPTIONS = [
  'Software Engineering',
  'Computer Science',
  'Information Science',
  'Information Systems',
] as const;

export const registerInstitutionSchema = z.object({
  universityName: z
    .string()
    .min(2, 'University name must be at least 2 characters')
    .max(100, 'University name must be less than 100 characters'),
  departmentName: z
    .string()
    .min(1, 'Please select a department')
    .refine(
      (value) => (DEPARTMENT_NAME_OPTIONS as readonly string[]).includes(value),
      'Please select a valid department'
    ),
  departmentCode: z
    .string()
    .min(2, 'Department code must be at least 2 characters')
    .max(20, 'Department code must be less than 20 characters')
    .regex(/^[A-Z0-9]+$/, 'Department code can only contain uppercase letters and numbers'),
  departmentDescription: z
    .string()
    .optional(),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(100, 'Email must be less than 100 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
});

export type RegisterInstitutionFormData = z.infer<typeof registerInstitutionSchema>;

// OTP Verification Schema
export const verifyOtpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers'),
});

export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;

// Login Schema
export const loginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
  tenantDomain: z
    .string()
    .optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Resend OTP Schema
export const resendOtpSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address'),
});

export type ResendOtpFormData = z.infer<typeof resendOtpSchema>;