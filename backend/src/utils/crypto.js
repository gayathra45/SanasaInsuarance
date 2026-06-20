import crypto from "crypto";

/**
 * Hashes a password using SHA-256 to match the project's standard hashing logic.
 * @param {string} password - The plain text password to hash.
 * @returns {string} The hexadecimal SHA-256 hash.
 */
export function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}
