import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: true, serverKey: !!process.env.ANTHROPIC_API_KEY });
}
