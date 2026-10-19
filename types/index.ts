export type UserRole = "admin" | "student";

export interface Profile {
  id: string;
  display_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  slug: string;
  description?: string | null;
  display_order: number;
  icon?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Semester {
  id: string;
  department_id?: string | null;
  number: number;
  semester_number?: number;
  title: string;
  slug: string;
  created_at?: string;
  updated_at?: string;
}

export interface Faculty {
  id: string;
  name: string;
  title?: string | null;
  department?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Topic {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  description?: string | null;
  display_order: number;
  published?: boolean;
  created_at?: string;
  updated_at?: string;
  // Joined
  module?: Module;
  lectures_count?: number;
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
  department_id?: string | null;
  semester_id?: string | null;
  semester_number?: number | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Computed / joined fields
  department?: Department;
  semester?: Semester;
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
  topics?: Topic[];
  lessons_count?: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  module_id: string;
  topic_id?: string | null;
  faculty_id?: string | null;
  title: string;
  slug: string;
  lesson_number?: number | null;
  sequence_order?: number | null;
  orderIndex?: number | null;
  description?: string | null;
  short_description?: string | null;
  thumbnail_path?: string | null;
  duration_seconds?: number | null;
  published: boolean;
  display_order: number;
  order_index?: number;
  status?: "published" | "draft" | "archived";
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // YouTube Video fields
  youtube_url?: string | null;
  youtube_video_id?: string | null;
  youtubeUrl?: string | null;
  youtubeVideoId?: string | null;
  // Instructor / Faculty attribution
  instructor?: string | null;
  faculty?: Faculty;
  // Joined / legacy fields
  video_id?: string | null;
  videoId?: string | null;
  topic?: Topic;
  module?: Module;
  subject?: Subject;
  video?: Video | null;
  materials?: Material[];
}

/**
 * In ENGIVAULT, Lecture is the central academic unit (represented canonically by Lesson in the data layer).
 */
export type Lecture = Lesson;

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
  youtube_url?: string | null;
  youtube_video_id?: string | null;
}
