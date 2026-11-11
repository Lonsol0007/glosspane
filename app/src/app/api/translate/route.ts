import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, noKey, rateLimit, resolveKey } from "@/lib/server/guard";
import { MODELS, translatePageImage } from "@/lib/server/translator";

export const maxDuration = 120;

// 5 MB of image is about 6.7M base64 characters.
const MAX_BASE64 = 6_700_000;

const bodySchema = z.object({
  image: z.string().min(100).max(MAX_BASE64).regex(/^[A-Za-z0-9+/]+={0,2}$/),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  targetLang: z.string().min(2).max(40).regex(/^[\p{L} ()-]+$/u),
  model: z.enum(MODELS).default("claude-opus-5-5"),
});

export async function POST(request: Request) {
  const limited = rateLimit(request, 30);
  if (limited) return limited;
  const key = resolveKey(request);
  if (!key) return noKey();
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BASE64 + 10_000) return NextResponse.json({ error: "The page image is too large to translate (5 MB at most)." }, { status: 413 });
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "The translation request was not valid." }, { status: 400 });
  try {
    return NextResponse.json({ blocks: await translatePageImage(key, body.data) });
  } catch (e) {
    return errorResponse(e);
  }
}
