import { createAdminClient, isSupabaseConfigured } from "../supabase/admin";

const VIDEO_EXPIRY_SECONDS = 60 * 60 * 4; // 4 hours for lecture watching
const MATERIAL_EXPIRY_SECONDS = 60 * 30; // 30 minutes for file download

/**
 * Creates a short-lived signed URL for a video in Supabase Storage.
 * If Supabase is not yet configured, returns a demo streaming video path or placeholder.
 */
export async function getSignedVideoUrl(storagePath: string): Promise<string> {
  if (!isSupabaseConfigured()) {
    // If it's an external url or sample video
    if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
      return storagePath;
    }
    // High quality sample HTML5 educational video for offline testing
    return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from("engivault-videos")
      .createSignedUrl(storagePath, VIDEO_EXPIRY_SECONDS);

    if (error || !data?.signedUrl) {
      console.error("Failed to create signed video URL:", error);
      return "";
    }

    return data.signedUrl;
  } catch (err) {
    console.error("Error signing video URL:", err);
    return "";
  }
}

/**
 * Creates a short-lived signed URL for downloadable materials in Supabase Storage.
 */
export async function getSignedMaterialUrl(storagePath: string): Promise<string> {
  if (!isSupabaseConfigured()) {
    if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
      return storagePath;
    }
    return "#sample-material-download";
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from("engivault-materials")
      .createSignedUrl(storagePath, MATERIAL_EXPIRY_SECONDS, {
        download: true,
      });

    if (error || !data?.signedUrl) {
      console.error("Failed to create signed material URL:", error);
      return "";
    }

    return data.signedUrl;
  } catch (err) {
    console.error("Error signing material URL:", err);
    return "";
  }
}
