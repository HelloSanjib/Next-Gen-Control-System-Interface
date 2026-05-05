import { NextRequest, NextResponse } from "next/server";
import { buildMockFrame } from "@/lib/alertSimulator";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cursorParam = request.nextUrl.searchParams.get("cursor");
  const parsedCursor = cursorParam ? Number.parseInt(cursorParam, 10) : Math.floor(Date.now() / 3600);
  const cursor = Number.isFinite(parsedCursor) ? parsedCursor : 0;
  const frame = buildMockFrame(cursor);

  return NextResponse.json(frame, {
    headers: {
      "Cache-Control": "no-store, max-age=0"
    }
  });
}
