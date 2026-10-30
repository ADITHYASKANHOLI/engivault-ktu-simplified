import { z } from "zod";

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters")
    .refine((val) => !/[\r\n]/.test(val), "Name cannot contain newline characters"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .max(254, "Email address is too long"),
  subject: z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject cannot exceed 200 characters")
    .refine((val) => !/[\r\n]/.test(val), "Subject cannot contain newline characters"),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message cannot exceed 5000 characters"),
  hp_company: z.string().max(0, "Spam detected").optional().or(z.literal("")),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
