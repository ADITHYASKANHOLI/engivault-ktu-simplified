import { z } from "zod";
import { isValidYouTubeUrl } from "../utils/youtube";

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

export const uuidSchema = z
  .string()
  .min(1, "Identifier is required")
  .max(128, "Identifier is too long");

export const moduleSchema = z.object({
  subject_id: uuidSchema,
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
  subject_id: uuidSchema.optional(),
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
  module_id: uuidSchema,
  topic_id: uuidSchema.optional().nullable(),
  faculty_id: uuidSchema.optional().nullable(),
  title: z.string().min(2, "Title must be at least 2 characters").max(200),
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
  published: z.boolean().default(false),
  display_order: z.number().int().default(0),
  order_index: z.number().int().optional(),
  instructor: z.string().max(200).optional().nullable(),
  status: z.enum(["published", "draft", "archived"]).optional(),
  youtube_url: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || !val.trim()) return true;
        return isValidYouTubeUrl(val);
      },
      { message: "Please enter a valid YouTube video link." }
    ),
  youtube_video_id: z.string().optional().nullable(),
});

/**
 * Strict schema for the Add Lecture workflow where Lecture Name and YouTube Video Link are REQUIRED.
 */
export const createLectureWorkflowSchema = z.object({
  title: z.string().min(2, "Lecture name is required (minimum 2 characters)").max(200),
  youtube_url: z
    .string()
    .min(1, "YouTube video link is required")
    .refine((val) => isValidYouTubeUrl(val), {
      message: "Please enter a valid YouTube video link.",
    }),
  module_id: uuidSchema,
  topic_id: uuidSchema.optional().nullable(),
  faculty_id: uuidSchema.optional().nullable(),
  description: z.string().max(3000).optional().nullable(),
  lesson_number: z.number().int().min(1).optional().nullable(),
  published: z.boolean().default(true),
  instructor: z.string().max(200).optional().nullable(),
});

export const lessonUpdateSchema = z.object({
  module_id: uuidSchema.optional(),
  topic_id: uuidSchema.optional().nullable(),
  faculty_id: uuidSchema.optional().nullable(),
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
  order_index: z.number().int().optional(),
  instructor: z.string().max(200).optional().nullable(),
  status: z.enum(["published", "draft", "archived"]).optional(),
  youtube_url: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || !val.trim()) return true;
        return isValidYouTubeUrl(val);
      },
      { message: "Please enter a valid YouTube video link." }
    ),
  youtube_video_id: z.string().optional().nullable(),
});

export const videoSchema = z.object({
  lesson_id: uuidSchema,
  title: z.string().max(200).optional().nullable(),
  storage_path: z.string().min(1, "Storage path is required"),
  mime_type: z.string().min(1, "MIME type is required"),
  file_size: z.number().int().min(0).optional().nullable(),
  thumbnail_path: z.string().optional().nullable(),
  duration_seconds: z.number().int().min(0).optional().nullable(),
  published: z.boolean().default(true),
});

export const videoUpdateSchema = z.object({
  lesson_id: uuidSchema.optional(),
  title: z.string().max(200).optional().nullable(),
  storage_path: z.string().min(1, "Storage path is required").optional(),
  mime_type: z.string().min(1, "MIME type is required").optional(),
  file_size: z.number().int().min(0).optional().nullable(),
  thumbnail_path: z.string().optional().nullable(),
  duration_seconds: z.number().int().min(0).optional().nullable(),
  published: z.boolean().optional(),
});

export const materialSchema = z.object({
  lesson_id: uuidSchema,
  subject_id: uuidSchema.optional().nullable(),
  module_id: uuidSchema.optional().nullable(),
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
  lesson_id: uuidSchema.optional(),
  subject_id: uuidSchema.optional().nullable(),
  module_id: uuidSchema.optional().nullable(),
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
  subject_id: uuidSchema.optional().nullable().or(z.literal("")),
  module_id: uuidSchema.optional().nullable().or(z.literal("")),
  lesson_id: uuidSchema.optional().nullable().or(z.literal("")),
});

export const worksSupportingResourceSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().min(1, "URL is required"),
  type: z.enum(["document", "link", "slides", "code", "form", "other"]).optional().default("link"),
});

export const worksActivitySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title is too long"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  short_description: z.string().max(500).optional().nullable(),
  description: z.string().min(10, "Description must be at least 10 characters").max(10000),
  category: z.string().min(1, "Category is required").max(100),
  activity_type: z.string().min(1, "Activity type is required").max(100),
  delivery_mode: z.enum(["in_person", "online", "hybrid"]).default("in_person"),
  venue: z.string().max(300).optional().nullable(),
  cover_image: z.string().optional().nullable(),
  start_at: z.string().optional().nullable(),
  end_at: z.string().optional().nullable(),
  timezone: z.string().max(100).optional().default("Asia/Kolkata"),
  organizer_details: z.string().max(500).optional().nullable(),
  learning_outcomes: z.array(z.string()).optional().nullable(),
  registration_url: z.string().optional().nullable(),
  registration_opens_at: z.string().optional().nullable(),
  registration_closes_at: z.string().optional().nullable(),
  fee_amount: z.number().min(0).default(0),
  currency: z.string().max(10).default("INR"),
  capacity: z.number().int().positive().optional().nullable(),
  contact_email: z.string().optional().nullable(),
  contact_phone: z.string().max(50).optional().nullable(),
  supporting_resources: z.array(worksSupportingResourceSchema).optional().default([]),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  is_featured: z.boolean().default(false),
});

export const worksActivityUpdateSchema = worksActivitySchema.partial();

export * from "./contact";



