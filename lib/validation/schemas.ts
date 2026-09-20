import { z } from "zod";

export const verifyCodeSchema = z.object({
  code: z
    .string()
    .min(1, "Access code is required")
    .max(100, "Access code is too long")
    .trim(),
});

export const subjectSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(150),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  code: z.string().max(20).optional().nullable(),
  short_description: z.string().max(300).optional().nullable(),
  description: z.string().max(3000).optional().nullable(),
  thumbnail_path: z.string().optional().nullable(),
  published: z.boolean().default(false),
  display_order: z.number().int().default(0),
});

export const subjectUpdateSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(150).optional(),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  code: z.string().max(20).optional().nullable(),
  short_description: z.string().max(300).optional().nullable(),
  description: z.string().max(3000).optional().nullable(),
  thumbnail_path: z.string().optional().nullable(),
  published: z.boolean().optional(),
  display_order: z.number().int().optional(),
});

export const moduleSchema = z.object({
  subject_id: z.string().uuid("Invalid subject ID"),
  title: z.string().min(2, "Title must be at least 2 characters").max(150),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  short_description: z.string().max(500).optional().nullable(),
  display_order: z.number().int().default(0),
  published: z.boolean().default(false),
});

export const moduleUpdateSchema = z.object({
  subject_id: z.string().uuid("Invalid subject ID").optional(),
  title: z.string().min(2, "Title must be at least 2 characters").max(150).optional(),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  short_description: z.string().max(500).optional().nullable(),
  display_order: z.number().int().optional(),
  published: z.boolean().optional(),
});

export const lessonSchema = z.object({
  module_id: z.string().uuid("Invalid module ID"),
  title: z.string().min(2, "Title must be at least 2 characters").max(200),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  lesson_number: z.number().int().min(1).optional().nullable(),
  description: z.string().max(3000).optional().nullable(),
  thumbnail_path: z.string().optional().nullable(),
  duration_seconds: z.number().int().min(0).optional().nullable(),
  published: z.boolean().default(false),
  display_order: z.number().int().default(0),
});

export const lessonUpdateSchema = z.object({
  module_id: z.string().uuid("Invalid module ID").optional(),
  title: z.string().min(2, "Title must be at least 2 characters").max(200).optional(),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  lesson_number: z.number().int().min(1).optional().nullable(),
  description: z.string().max(3000).optional().nullable(),
  thumbnail_path: z.string().optional().nullable(),
  duration_seconds: z.number().int().min(0).optional().nullable(),
  published: z.boolean().optional(),
  display_order: z.number().int().optional(),
});

export const videoSchema = z.object({
  lesson_id: z.string().uuid("Invalid lesson ID"),
  title: z.string().max(200).optional().nullable(),
  storage_path: z.string().min(1, "Storage path is required"),
  mime_type: z.string().min(1, "MIME type is required"),
  file_size: z.number().int().min(0).optional().nullable(),
  thumbnail_path: z.string().optional().nullable(),
  duration_seconds: z.number().int().min(0).optional().nullable(),
  published: z.boolean().default(true),
});

export const videoUpdateSchema = z.object({
  lesson_id: z.string().uuid("Invalid lesson ID").optional(),
  title: z.string().max(200).optional().nullable(),
  storage_path: z.string().min(1, "Storage path is required").optional(),
  mime_type: z.string().min(1, "MIME type is required").optional(),
  file_size: z.number().int().min(0).optional().nullable(),
  thumbnail_path: z.string().optional().nullable(),
  duration_seconds: z.number().int().min(0).optional().nullable(),
  published: z.boolean().optional(),
});

export const materialSchema = z.object({
  lesson_id: z.string().uuid("Invalid lesson ID"),
  subject_id: z.string().uuid().optional().nullable(),
  module_id: z.string().uuid().optional().nullable(),
  title: z.string().min(2, "Title must be at least 2 characters").max(200),
  description: z.string().max(1000).optional().nullable(),
  material_type: z.string().min(1).max(50).default("pdf"),
  storage_path: z.string().min(1, "Storage path is required"),
  original_filename: z.string().min(1, "Original filename is required"),
  mime_type: z.string().min(1, "MIME type is required"),
  file_size: z.number().int().min(0).optional().nullable(),
  published: z.boolean().default(false),
  display_order: z.number().int().default(0),
});

export const materialUpdateSchema = z.object({
  lesson_id: z.string().uuid("Invalid lesson ID").optional(),
  subject_id: z.string().uuid().optional().nullable(),
  module_id: z.string().uuid().optional().nullable(),
  title: z.string().min(2, "Title must be at least 2 characters").max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  material_type: z.string().min(1).max(50).optional(),
  storage_path: z.string().min(1, "Storage path is required").optional(),
  original_filename: z.string().min(1, "Original filename is required").optional(),
  mime_type: z.string().min(1, "MIME type is required").optional(),
  file_size: z.number().int().min(0).optional().nullable(),
  published: z.boolean().optional(),
  display_order: z.number().int().optional(),
});

export const siteSettingsSchema = z.object({
  site_name: z.string().min(2).max(100),
  headline: z.string().max(200).optional().nullable(),
  tagline: z.string().max(200).optional().nullable(),
  logo_path: z.string().optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  about_text: z.string().max(5000).optional().nullable(),
  footer_text: z.string().max(500).optional().nullable(),
  social_links: z
    .object({
      github: z.string().url().optional().or(z.literal("")),
      linkedin: z.string().url().optional().or(z.literal("")),
      telegram: z.string().url().optional().or(z.literal("")),
      youtube: z.string().url().optional().or(z.literal("")),
      twitter: z.string().url().optional().or(z.literal("")),
    })
    .optional(),
});

export const uploadAuthorizeSchema = z.object({
  bucket: z.enum(["engivault-videos", "engivault-materials", "engivault-thumbnails", "engivault-branding"]),
  filename: z.string().min(1),
  mime_type: z.string().min(1),
  file_size: z.number().int().positive(),
  subject_id: z.string().uuid().optional(),
  module_id: z.string().uuid().optional(),
  lesson_id: z.string().uuid().optional(),
});
