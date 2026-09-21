import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./client";

export interface AdminConfigValidation {
  url: string;
  serviceKey: string;
  role?: string;
  projectRef?: string;
}

/**
 * Validates Supabase administrative configuration.
 * Fails fast and loudly if SUPABASE_SERVICE_ROLE_KEY is missing, placeholder,
 * carries an invalid role claim (e.g. 'anon'), or mismatches the project URL.
 */
export function validateAdminConfig(): AdminConfigValidation {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || url.includes("your-project") || url.includes("placeholder")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is missing or set to placeholder. Admin client requires a valid Supabase project URL."
    );
  }

  if (
    !serviceKey ||
    serviceKey === "placeholder-service-key" ||
    serviceKey === "your-service-role-key" ||
    serviceKey.trim() === ""
  ) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing or set to placeholder. Admin client requires a valid Supabase service_role key to execute administrative operations."
    );
  }

  let role: string | undefined;
  let projectRef: string | undefined;

  // Validate JWT structure and role claim if key is formatted as a JWT
  if (serviceKey.includes(".")) {
    try {
      const parts = serviceKey.split(".");
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
        role = payload.role;
        projectRef = payload.ref;

        if (role && role !== "service_role") {
          throw new Error(
            `SUPABASE_SERVICE_ROLE_KEY has invalid role claim: '${role}'. Expected 'service_role'. An anon key cannot bypass Row-Level Security (RLS) for admin operations.`
          );
        }

        const urlMatch = url.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co/i);
        const expectedRef = urlMatch?.[1];
        if (expectedRef && projectRef && expectedRef !== projectRef) {
          throw new Error(
            `SUPABASE_SERVICE_ROLE_KEY project ref '${projectRef}' does not match NEXT_PUBLIC_SUPABASE_URL project ref '${expectedRef}'.`
          );
        }
      }
    } catch (err: any) {
      if (
        err.message?.includes("invalid role claim") ||
        err.message?.includes("does not match")
      ) {
        throw err;
      }
      throw new Error(`SUPABASE_SERVICE_ROLE_KEY is not a valid JWT: ${err.message}`);
    }
  }

  return { url, serviceKey, role, projectRef };
}

export function isSupabaseAdminConfigured(): boolean {
  try {
    validateAdminConfig();
    return true;
  } catch {
    return false;
  }
}

export function createAdminClient() {
  const { url, serviceKey } = validateAdminConfig();

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export { isSupabaseConfigured };

