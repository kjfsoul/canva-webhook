import { NextRequest, NextResponse } from "next/server";

const WEBHOOK_TOKEN = process.env.CANVA_WEBHOOK_SECRET!;

function isAuthorized(req: NextRequest) {
  const headerToken = req.headers.get("x-canva-token");
  const queryToken = req.nextUrl.searchParams.get("token");
  const token = headerToken ?? queryToken ?? "";
  return Boolean(WEBHOOK_TOKEN) && token === WEBHOOK_TOKEN;
}

type CanvaEvent = { type?: string; id?: string; data?: { id?: string } };

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!isAuthorized(req)) return new NextResponse("forbidden", { status: 403 });

  let evt: CanvaEvent | null = null;
  try { evt = JSON.parse(raw) as CanvaEvent; } catch {}
  console.log("CANVA_EVENT", {
    type: evt?.type ?? "unknown",
    id: evt?.data?.id ?? evt?.id ?? "unknown",
    receivedAt: new Date().toISOString(),
  });

  return new NextResponse(null, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
