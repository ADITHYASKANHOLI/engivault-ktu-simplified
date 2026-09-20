#!/usr/bin/env node

/**
 * ENGIVAULT — Admin Access Code Generator
 * Generates a cryptographically secure random token and secure hash for server-side authorization.
 *
 * Usage:
 *   node scripts/generate-admin-code.mjs
 */

import { randomBytes, scryptSync } from "node:crypto";

function generateAdminAccessCode() {
  // Generate 16 bytes of entropy -> readable format: ENGIVAULT-XXXX-XXXX-XXXX
  const entropy = randomBytes(12).toString("hex").toUpperCase();
  const code = `ENGIVAULT-${entropy.slice(0, 4)}-${entropy.slice(4, 8)}-${entropy.slice(8, 12)}`;

  // Generate a random 16-byte salt
  const salt = randomBytes(16).toString("hex");

  // Derive scrypt key (N=16384, r=8, p=1, keylen=64)
  const derivedKey = scryptSync(code, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");

  // Format: scrypt:salt:derivedKey
  const hash = `scrypt:${salt}:${derivedKey}`;

  return { code, hash };
}

const { code, hash } = generateAdminAccessCode();

console.log("\n=======================================================");
console.log("             ENGIVAULT ADMIN CODE GENERATOR            ");
console.log("=======================================================\n");
console.log("⚠️  SAVE THIS ACCESS CODE NOW. IT WILL NEVER BE SHOWN AGAIN:\n");
console.log(`   Admin Access Code: \x1b[32m\x1b[1m${code}\x1b[0m\n`);
console.log("-------------------------------------------------------");
console.log("Add the following line to your .env.local file and Vercel Environment Variables:\n");
console.log(`ADMIN_ACCESS_CODE="${code}"\n`);
console.log("Optional fallback hash (if using scrypt hash verification):\n");
console.log(`ADMIN_ACCESS_CODE_HASH="${hash}"\n`);
console.log("=======================================================\n");
