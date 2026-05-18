import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export type SessionPayload =
  | { role: "tenant"; id: number }
  | { role: "admin"; id: number };

export const SESSION_COOKIE = "kr_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return secret;
}

function b64urlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(value: string): string {
  return b64urlEncode(createHmac("sha256", getSecret()).update(value).digest());
}

function encode(payload: SessionPayload): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const body = b64urlEncode(Buffer.from(JSON.stringify({ ...payload, exp })));
  const sig = sign(body);
  return `${body}.${sig}`;
}

function decode(token: string): SessionPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(b64urlDecode(body).toString("utf-8"));
    if (typeof data.exp !== "number" || data.exp * 1000 < Date.now()) return null;
    if (data.role === "tenant" || data.role === "admin") {
      if (typeof data.id === "number") return { role: data.role, id: data.id };
    }
    return null;
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, encode(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return decode(raw);
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
