import { cookies } from "next/headers";
import {
  COOKIE_NAME,
  SESSION_MAX_AGE,
  createSignedToken,
  verifySignedToken,
} from "./token";

export * from "./token";

/**
 * Check if the current request is from an authenticated admin (server components / route handlers)
 */
export async function getAdminSession(): Promise<{ role: "admin" } | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return null;

  const valid = verifySignedToken(cookie.value);
  if (!valid || valid.role !== "admin") return null;

  return { role: "admin" };
}

/**
 * Sets the admin session cookie
 */
export async function setAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const token = createSignedToken({ role: "admin", createdAt: Date.now() });

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/**
 * Clears the admin session cookie
 */
export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
