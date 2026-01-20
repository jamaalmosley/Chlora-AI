import { z } from "zod";

// Helper for common field patterns
const MAX_TEXT_LENGTH = 500;
const MAX_LONG_TEXT_LENGTH = 5000;
const MAX_SHORT_TEXT_LENGTH = 200;

// Common validation patterns
const phoneRegex = /^[\d\s\-+()]*$/;
const dateInPast = (date: string) => {
  if (!date) return true;
  return new Date(date) <= new Date();
};
const dateInFuture = (date: string) => {
  if (!date) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) >= today;
};

// Practice validation schema
export const practiceSchema = z.object({
  name: z
    .string()
    .min(1, "Practice name is required")
    .max(MAX_SHORT_TEXT_LENGTH, `Practice name must be less than ${MAX_SHORT_TEXT_LENGTH} characters`),
  address: z
    .string()
    .max(MAX_TEXT_LENGTH, `Address must be less than ${MAX_TEXT_LENGTH} characters`)
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  phone: z
    .string()
    .max(20, "Phone number must be less than 20 characters")
    .regex(phoneRegex, "Phone number contains invalid characters")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  email: z
    .string()
    .email("Invalid email format")
    .max(100, "Email must be less than 100 characters")
    .optional()
    .nullable()
    .transform((val) => val?.trim()?.toLowerCase() || null),
});

export type PracticeInput = z.infer<typeof practiceSchema>;

// Patient profile validation schema
export const patientProfileSchema = z.object({
  date_of_birth: z
    .string()
    .optional()
    .refine((val) => !val || dateInPast(val), "Date of birth cannot be in the future"),
  address: z
    .string()
    .max(MAX_TEXT_LENGTH, `Address must be less than ${MAX_TEXT_LENGTH} characters`)
    .optional()
    .nullable(),
  insurance_provider: z
    .string()
    .max(MAX_SHORT_TEXT_LENGTH, `Insurance provider must be less than ${MAX_SHORT_TEXT_LENGTH} characters`)
    .optional()
    .nullable(),
  insurance_number: z
    .string()
    .max(50, "Insurance number must be less than 50 characters")
    .optional()
    .nullable(),
  emergency_contact_name: z
    .string()
    .max(100, "Emergency contact name must be less than 100 characters")
    .optional()
    .nullable(),
  emergency_contact_relationship: z
    .string()
    .max(50, "Relationship must be less than 50 characters")
    .optional()
    .nullable(),
  emergency_contact_phone: z
    .string()
    .max(20, "Phone number must be less than 20 characters")
    .regex(phoneRegex, "Phone number contains invalid characters")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  medical_history: z
    .array(z.string().max(MAX_SHORT_TEXT_LENGTH, "Each medical history item must be less than 200 characters"))
    .max(100, "Too many medical history items")
    .optional()
    .nullable(),
  allergies: z
    .array(z.string().max(100, "Each allergy must be less than 100 characters"))
    .max(50, "Too many allergies listed")
    .optional()
    .nullable(),
});

export type PatientProfileInput = z.infer<typeof patientProfileSchema>;

// Appointment validation schema
export const appointmentSchema = z.object({
  patientName: z
    .string()
    .min(1, "Patient name is required")
    .max(100, "Patient name must be less than 100 characters"),
  date: z
    .string()
    .min(1, "Date is required")
    .refine(dateInFuture, "Appointment date must be in the future"),
  time: z
    .string()
    .min(1, "Time is required")
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  type: z
    .string()
    .min(1, "Appointment type is required")
    .max(50, "Appointment type must be less than 50 characters"),
  duration: z
    .string()
    .regex(/^(15|30|45|60|90|120)$/, "Invalid duration"),
  notes: z
    .string()
    .max(2000, "Notes must be less than 2000 characters")
    .optional()
    .transform((val) => val?.trim() || ""),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

// Medical record validation schema
export const medicalRecordSchema = z.object({
  testType: z
    .string()
    .min(1, "Test type is required"),
  testName: z
    .string()
    .min(1, "Test name is required")
    .max(MAX_SHORT_TEXT_LENGTH, `Test name must be less than ${MAX_SHORT_TEXT_LENGTH} characters`),
  testDate: z
    .string()
    .min(1, "Test date is required")
    .refine(dateInPast, "Test date cannot be in the future"),
  findings: z
    .string()
    .max(MAX_LONG_TEXT_LENGTH, `Findings must be less than ${MAX_LONG_TEXT_LENGTH} characters`)
    .optional()
    .transform((val) => val?.trim() || null),
  notes: z
    .string()
    .max(2000, "Notes must be less than 2000 characters")
    .optional()
    .transform((val) => val?.trim() || null),
});

export type MedicalRecordInput = z.infer<typeof medicalRecordSchema>;

// Helper function to format Zod errors for toast display
export function formatZodError(error: z.ZodError): string {
  return error.errors.map((e) => e.message).join(". ");
}

// Type for validation result
export type ValidationResult<T> = 
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: string };

// Helper function to validate and return result
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: formatZodError(result.error) };
}
