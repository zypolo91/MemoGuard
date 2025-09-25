import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) {
    throw new Error("Stored password hash is in an invalid format.");
  }
  const derived = scryptSync(password, salt, KEY_LENGTH);
  const original = Buffer.from(hash, "hex");
  if (derived.length !== original.length) {
    return false;
  }
  return timingSafeEqual(derived, original);
}
