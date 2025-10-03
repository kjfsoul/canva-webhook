import { NextRequest, NextResponse } from "next/server";

const WEBHOOK_TOKEN = process.env.CANVA_WEBHOOK_SECRET!;

function authorized(req: NextRequest) {
  const token = req.headers.get("x-canva-token"); // same value you set in Canva
  return !!WEBHOOK_TOKEN && token === WEBHOOK_TOKEN;
}

export async function POST(req: NextRequest) {
  const raw = await req.text(); // read raw for future signatures
  if (!authorized(req)) return new NextResponse("forbidden", { status: 403 });

  let evt: any = {};
  try {
    evt = JSON.parse(raw);
  } catch {}
  console.log("CANVA_EVENT", evt?.type, evt?.data?.id ?? evt?.id);
  return new NextResponse(null, { status: 200 }); // ACK fast
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
