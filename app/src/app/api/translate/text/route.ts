import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, noKey, rateLimit, resolveKey } from "@/lib/server/guard";
import { MODELS, translateTexts } from "@/lib/server/translator";

export const maxDuration = 60;

const bodySchema = z.object({
  texts: z.array(z.string().min(1).max(2000)).min(1).max(50),
  targetLang: z.string().min(2).max(40).regex(/^[\p{L} ()-]+$/u),
  model: z.enum(MODELS).default("claude-opus-5-5"),
});

export async function POST(request: Request) {
  const limited = rateLimit(request, 60);
  if (limited) return limited;
  const key = resolveKey(request);
  if (!key) return noKey();
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "The translation request was not valid." }, { status: 400 });
  try {
    return NextResponse.json({ translations: await translateTexts(key, body.data) });
  } catch (e) {
    return errorResponse(e);
  }
}
