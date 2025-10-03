import { NextRequest, NextResponse } from "next/server";

const TOKEN_URL   = "https://www.canva.com/api/oauth/token"\;
const CLIENT_ID   = process.env.CANVA_CLIENT_ID!;
const REDIRECT_URI = process.env.CANVA_REDIRECT_URI ?? "https://canva-webhook.vercel.app/api/canva/callback"\;

export async function GET(req: NextRequest) {
  const code   = req.nextUrl.searchParams.get("code");
  const state  = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("oauth_state")?.value;
  const verifier    = req.cookies.get("pkce_verifier")?.value;

  if (!CLIENT_ID) return new NextResponse("Missing CANVA_CLIENT_ID", { status: 500 });
  if (!code || !verifier || !state || state !== cookieState) {
    return new NextResponse("invalid oauth response", { status: 400 });
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  });

  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "accept": "application/json",
    },
    body,
  });

  const text = await r.text();
  if (!r.ok) {
    // Bubble up exact failure text for easier debugging
    return new NextResponse(`token exchange failed: ${text}`, { status: 400 });
  }

  // Try parse JSON; if not JSON, show plain response
  let json: any = null;
  try { json = JSON.parse(text); } catch {}
  if (!json) return new NextResponse(text, { status: 200 });

  // TODO: store tokens securely (DB/KV). For now acknowledge success minimally.
  return NextResponse.json({
    ok: true,
    tokens: { hasAccess: !!json.access_token, hasRefresh: !!json.refresh_token },
  });
}
