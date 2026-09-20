export type UserRole = "admin" | "student";

export interface Profile {
  id: string;
  display_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  title: string;
  slug: string;
  code?: string | null;
  short_description?: string | null;
  description?: string | null;
  thumbnail_path?: string | null;
  published: boolean;
  display_order: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Computed / joined fields
  modules_count?: number;
  lessons_count?: number;
  materials_count?: number;
}

export interface Module {
  id: string;
  subject_id: string;
  title: string;
  slug: string;
  short_description?: string | null;
  display_order: number;
  published: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  subject?: Subject;
  lessons_count?: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  lesson_number?: number | null;
  description?: string | null;
  thumbnail_path?: string | null;
  duration_seconds?: number | null;
  published: boolean;
  display_order: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  module?: Module;
  video?: Video | null;
  materials?: Material[];
}

export interface Video {
  id: string;
  lesson_id: string;
  title?: string | null;
  storage_path: string;
  mime_type: string;
  file_size?: number | null;
  thumbnail_path?: string | null;
  duration_seconds?: number | null;
  published: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Virtual signed streaming URL for client playback
  playback_url?: string;
}

export type MaterialType = "pdf" | "notes" | "question_paper" | "presentation" | "other";

export interface Material {
  id: string;
  lesson_id: string;
  subject_id?: string | null;
  module_id?: string | null;
  title: string;
  description?: string | null;
  material_type: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  file_size?: number | null;
  published: boolean;
  display_order: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  // Virtual signed download URL
  download_url?: string;
}

export type UploadStatus = "pending" | "uploading" | "completed" | "failed" | "deleted";

export interface Upload {
  id: string;
  storage_path?: string | null;
  original_filename?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  status: UploadStatus;
  error_message?: string | null;
  created_by?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface ActivityLog {
  id: string;
  actor_id?: string | null;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface SiteSettings {
  id: string;
  site_name: string;
  headline?: string | null;
  tagline?: string | null;
  logo_path?: string | null;
  contact_email?: string | null;
  about_text?: string | null;
  footer_text?: string | null;
  social_links?: {
    github?: string;
    linkedin?: string;
    telegram?: string;
    youtube?: string;
    twitter?: string;
  };
  updated_by?: string | null;
  updated_at: string;
}

export interface SearchResultItem {
  id: string;
  type: "subject" | "module" | "lesson" | "material";
  title: string;
  description?: string | null;
  url: string;
  badge?: string;
}
