import { NextRequest } from "next/server";
import { buildMockFrame } from "@/lib/alertSimulator";
import { triageAlerts } from "@/lib/triageEngine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  let cursor = 0;
  let timerId: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    start(controller) {
      const push = () => {
        if (request.signal.aborted) return;
        try {
          const frame = buildMockFrame(cursor);
          const triage = triageAlerts({ alerts: frame.alerts, systems: frame.systems });
          cursor = frame.cursor;
          const payload = JSON.stringify({ frame, triage });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          // silent — keep stream alive
        }
      };

      push();
      timerId = setInterval(push, 3800);

      request.signal.addEventListener("abort", () => {
        clearInterval(timerId);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      clearInterval(timerId);
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
