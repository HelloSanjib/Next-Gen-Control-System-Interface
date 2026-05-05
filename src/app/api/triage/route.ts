import { NextRequest, NextResponse } from "next/server";
import { triageAlerts } from "@/lib/triageEngine";
import type { IndustrialAlert, IndustrialSystem } from "@/types/industrial";

export const dynamic = "force-dynamic";

interface TriageBody {
  alerts?: IndustrialAlert[];
  systems?: IndustrialSystem[];
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as TriageBody;
  const alerts = Array.isArray(body.alerts) ? body.alerts : [];
  const systems = Array.isArray(body.systems) ? body.systems : [];
  const result = triageAlerts({ alerts, systems });

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "no-store, max-age=0"
    }
  });
}
