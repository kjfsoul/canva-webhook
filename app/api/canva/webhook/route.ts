import { NextRequest, NextResponse } from "next/server";

const WEBHOOK_TOKEN = process.env.CANVA_WEBHOOK_SECRET!; // set in Vercel env

function isAuthorized(req: NextRequest) {
  // Canva should send this header/value (you’ll set the same token in Canva portal)
  const token = req.headers.get("x-canva-token");
  return token && WEBHOOK_TOKEN && token === WEBHOOK_TOKEN;
}

export async function POST(req: NextRequest) {
  // Read raw text (handy if Canva later adds signature checks)
  const raw = await req.text();

  if (!isAuthorized(req)) {
    return new NextResponse("forbidden", { status: 403 });
  }

  // Parse body safely
  let evt: any = {};
  try {
    evt = JSON.parse(raw);
  } catch {
    /* ignore parse errors */
  }

  // Do minimal work here; queue heavy work elsewhere (job queue / cron)
  console.log("CANVA_EVENT", {
    type: evt?.type,
    id: evt?.data?.id ?? evt?.id,
    receivedAt: new Date().toISOString(),
  });

  // ACK fast so Canva doesn’t retry
  return new NextResponse(null, { status: 200 });
}

// Optional: GET for quick health checks
export async function GET() {
  return NextResponse.json({ ok: true });
}
