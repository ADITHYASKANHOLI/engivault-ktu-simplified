export const INTERNAL_STUDENT_DOMAIN = "students.fole.invalid";

export const RESERVED_USERNAMES = [
  "admin",
  "administrator",
  "fole",
  "engivault",
  "root",
  "support",
  "system",
  "mod",
  "moderator",
  "staff",
  "superuser",
  "guest",
  "bot",
] as const;

export const RESERVED_SET = new Set<string>(RESERVED_USERNAMES);

export const TRIVIALLY_WEAK_PASSWORDS = new Set<string>([
  "password",
  "password123",
  "12345678",
  "123456789",
  "1234567890",
  "qwertyui",
  "qwertyuiop",
  "engivault",
  "folecev123",
  "admin123",
  "student123",
]);

/**
 * Maps a public username to the internal Supabase non-routable email address
 */
export function usernameToInternalEmail(username: string): string {
  const clean = username.toLowerCase().trim();
  return `${clean}@${INTERNAL_STUDENT_DOMAIN}`;
}

/**
 * Checks if a username is in the reserved blacklist
 */
export function isReservedUsername(username: string): boolean {
  return RESERVED_SET.has(username.toLowerCase().trim());
}

/**
 * Validates whether a proposed password is weak according to NIST SP 800-63B guidelines
 */
export function isTriviallyWeakPassword(password: string, username?: string): boolean {
  const lower = password.toLowerCase().trim();
  if (username && lower === username.toLowerCase().trim()) {
    return true;
  }
  return TRIVIALLY_WEAK_PASSWORDS.has(lower);
}
