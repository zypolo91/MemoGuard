import crypto from "crypto";

function base64url(input: Buffer | string) {
  return (typeof input === "string" ? Buffer.from(input) : input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64url(input: string) {
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = 4 - (input.length % 4);
  if (pad !== 4) input = input + "=".repeat(pad);
  return Buffer.from(input, "base64");
}

export interface AdminTokenPayload {
  sub: string; // admin user id
  role: string;
  exp: number; // epoch seconds
  typ: "admin";
}

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret";
  return Buffer.from(secret);
}

export function signAdminToken(payload: Omit<AdminTokenPayload, "typ">) {
  const header = { alg: "HS256", typ: "JWT" };
  const tokenPayload: AdminTokenPayload = { ...payload, typ: "admin" } as AdminTokenPayload;
  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(tokenPayload));
  const data = `${headerB64}.${payloadB64}`;
  const sig = crypto.createHmac("sha256", getSecret()).update(data).digest();
  const sigB64 = base64url(sig);
  return `${data}.${sigB64}`;
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  const data = `${headerB64}.${payloadB64}`;
  const expected = crypto.createHmac("sha256", getSecret()).update(data).digest();
  const actual = fromBase64url(sigB64);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;
  const payload = JSON.parse(fromBase64url(payloadB64).toString("utf8")) as AdminTokenPayload;
  if (payload.typ !== "admin") return null;
  if (payload.exp && Date.now() / 1000 > payload.exp) return null;
  return payload;
}
