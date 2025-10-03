// app/api/canva/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";

const WEBHOOK_TOKEN = process.env.CANVA_WEBHOOK_SECRET!;

function authorized(req: NextRequest) {
  const token = req.headers.get("x-canva-token");
  return Boolean(WEBHOOK_TOKEN) && token === WEBHOOK_TOKEN;
}

type CanvaEvent = {
  type?: string;
  id?: string;
  data?: { id?: string };
};

export async function POST(req: NextRequest) {
  // Read raw body (handy if Canva introduces signatures later)
  const raw = await req.text();

  if (!authorized(req)) {
    return new NextResponse("forbidden", { status: 403 });
  }

  let evt: CanvaEvent | null = null;
  try {
    evt = JSON.parse(raw) as CanvaEvent;
  } catch {
    // ignore parse errors, still ACK so Canva doesn't retry forever
  }

  console.log("CANVA_EVENT", {
    type: evt?.type ?? "unknown",
    id: evt?.data?.id ?? evt?.id ?? "unknown",
    receivedAt: new Date().toISOString(),
  });

  // Ack fast; handle heavy work asynchronously (queue/db)
  return new NextResponse(null, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
