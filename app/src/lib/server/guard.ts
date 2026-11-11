import { NextResponse } from "next/server";
import { TranslatorError } from "./translator";

// Fixed-window limiter, per IP, per server instance. On serverless each instance keeps its
// own counts, so this slows abuse rather than guaranteeing a global limit. Callers still
// need their own provider key, which is the real cost control.
const WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(request: Request, limit: number): NextResponse | null {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }
  entry.count++;
  if (entry.count <= limit) return null;
  const retry = Math.ceil((entry.resetAt - now) / 1000);
  return NextResponse.json({ error: `Too many requests: the app's own limit was reached. Try again in ${retry} seconds.` }, { status: 429, headers: { "retry-after": String(retry) } });
}

/** The caller's own key, or the server's key when one is configured for a private deployment. */
export function resolveKey(request: Request): string | null {
  const header = request.headers.get("x-api-key")?.trim();
  if (header) return /^[\w-]{20,300}$/.test(header) ? header : null;
  return process.env.ANTHROPIC_API_KEY || null;
}

export const noKey = () => NextResponse.json({ error: "No API key. Add your key in translation settings." }, { status: 401 });

export function errorResponse(e: unknown): NextResponse {
  if (e instanceof TranslatorError) return NextResponse.json({ error: e.message }, { status: e.status });
  return NextResponse.json({ error: "Translation failed." }, { status: 500 });
}
