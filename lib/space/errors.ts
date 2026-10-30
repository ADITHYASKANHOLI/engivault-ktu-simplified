/**
 * FOLE SPACE Error Utilities & Detection
 * Provides centralized detection and controlled error messages for missing database schemas.
 */

export const FOLE_SPACE_SETUP_REQUIRED_MESSAGE = "FOLE SPACE database is not set up. Run migration 011.";
export const FOLE_SPACE_NOT_CONFIGURED_CODE = "FOLE_SPACE_DATABASE_NOT_CONFIGURED";

export interface StructuredDbError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
  statusCode?: number;
  isMissingSchema?: boolean;
}

/**
 * Accurately determines if a caught error or PostgREST response indicates that
 * the FOLE SPACE database schema (tables or RPCs) has not been migrated yet.
 *
 * Recognized error codes:
 * - PGRST205: PostgREST table is absent from schema cache
 * - 42P01: PostgreSQL undefined_table relation does not exist
 * - PGRST202: PostgREST function is absent from schema cache
 * - 42883: PostgreSQL undefined_function does not exist
 */
export function isMissingSpaceSchemaError(error: unknown): boolean {
  if (!error) return false;

  let code = "";
  let message = "";
  let details = "";

  if (typeof error === "string") {
    message = error.toLowerCase();
  } else if (typeof error === "object" && error !== null) {
    const err = error as Record<string, any>;
    if (err.isMissingSchema === true || err.code === FOLE_SPACE_NOT_CONFIGURED_CODE) {
      return true;
    }
    code = String(err.code || "");
    message = String(err.message || "").toLowerCase();
    details = String(err.details || "").toLowerCase();
  } else {
    return false;
  }

  const isMissingCode =
    code === "PGRST205" || // Table not in schema cache
    code === "42P01" ||    // Undefined table
    code === "PGRST202" || // Function not in schema cache
    code === "42883";      // Undefined function

  const mentionsSpace =
    message.includes("space_") ||
    message.includes("rpc_space_") ||
    details.includes("space_") ||
    details.includes("rpc_space_") ||
    message.includes("fole-space") ||
    message.includes("fole space");

  if (isMissingCode) {
    // If message or details is provided, it must be space-related
    if (mentionsSpace) return true;
    // If no message or details at all, but code is missing schema code, return true
    if (!message && !details) return true;
    return false;
  }

  // Inspect text patterns if code was missing or wrapped in Error
  if (
    mentionsSpace &&
    (
      message.includes("could not find the table") ||
      message.includes("could not find the function") ||
      message.includes("does not exist") ||
      message.includes("schema cache") ||
      message.includes("not set up")
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Creates a structured missing schema error for controlled throwing
 */
export function createMissingSchemaError(): Error & StructuredDbError {
  const error = new Error(FOLE_SPACE_SETUP_REQUIRED_MESSAGE) as Error & StructuredDbError;
  error.code = FOLE_SPACE_NOT_CONFIGURED_CODE;
  error.isMissingSchema = true;
  error.statusCode = 503;
  return error;
}
