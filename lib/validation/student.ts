import { z } from "zod";

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

export const studentUsernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username cannot exceed 20 characters")
  .regex(/^[a-z0-9_]+$/, "Username may only contain lowercase letters, numbers, and underscores")
  .refine((val) => !isReservedUsername(val), {
    message: "This username is reserved and cannot be registered",
  });

export const studentPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password cannot exceed 72 characters")
  .refine((val) => !TRIVIALLY_WEAK_PASSWORDS.has(val.toLowerCase()), {
    message: "This password is too common and easily guessed",
  });

export const studentSignupSchema = z
  .object({
    username: studentUsernameSchema,
    password: studentPasswordSchema,
  })
  .refine((data) => data.password.toLowerCase() !== data.username.toLowerCase(), {
    message: "Password cannot be identical to your username",
    path: ["password"],
  });

export const studentLoginSchema = z.object({
  username: z.string().min(1, "Username is required").max(50).trim(),
  password: z.string().min(1, "Password is required").max(72),
});

export const studentChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required").max(72),
  newPassword: studentPasswordSchema,
});

export const adminResetPasswordSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  newPassword: studentPasswordSchema,
});
