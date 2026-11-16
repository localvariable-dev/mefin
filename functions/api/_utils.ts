export interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
  RESEND_API_KEY?: string;
  RESET_FROM_EMAIL?: string;
  GEMINI_API_KEY?: string;
}

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  salt: string;
  vault_json: string;
  updated_at: number;
  reset_code_hash?: string | null;
  reset_expires_at?: number | null;
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" }, key, 256);
  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let output = str.replace(/-/g, "+").replace(/_/g, "/");
  while (output.length % 4) output += "=";
  return atob(output);
}

export async function signToken(userId: string, secret: string, email = ""): Promise<string> {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(JSON.stringify({ sub: userId, email, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 }));
  const data = `${header}.${payload}`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  const sigB64 = base64UrlEncode(String.fromCharCode(...new Uint8Array(sig)));

  return `${data}.${sigB64}`;
}

export async function verifyJwt(tokenOrHeader: string | null, secret: string): Promise<{ sub: string; email: string; exp: number } | null> {
  if (!tokenOrHeader) return null;
  const token = tokenOrHeader.startsWith("Bearer ") ? tokenOrHeader.slice(7).trim() : tokenOrHeader.trim();
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, payloadB64, sigB64] = parts;
  try {
    const data = `${header}.${payloadB64}`;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);

    const sigString = base64UrlDecode(sigB64);
    const sigBytes = new Uint8Array(sigString.length);
    for (let i = 0; i < sigString.length; i++) sigBytes[i] = sigString.charCodeAt(i);

    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(data));
    if (!valid) return null;

    const payload = JSON.parse(base64UrlDecode(payloadB64));
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

export async function verifyToken(authHeader: string | null, secret: string): Promise<string | null> {
  const payload = await verifyJwt(authHeader, secret);
  return payload ? payload.sub : null;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export async function readJson(request: Request): Promise<any> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export function jsonResponse(data: any, status = 200): Response {
  return Response.json(data, {
    status,
    headers: corsHeaders
  });
}
