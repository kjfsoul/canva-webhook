import { NextRequest, NextResponse } from "next/server";

const TOKEN_URL = "https://www.canva.com/api/oauth/token";
const CLIENT_ID = process.env.CANVA_CLIENT_ID!;
const REDIRECT_URI = "https://canva-webhook.vercel.app/api/canva/callback";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("oauth_state")?.value;
  const verifier = req.cookies.get("pkce_verifier")?.value;

  if (!code || !verifier || state !== cookieState) {
    return new NextResponse("invalid oauth response", { status: 400 });
  }

  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  });

  if (!r.ok) {
    const txt = await r.text();
    return new NextResponse(`token exchange failed: ${txt}`, { status: 400 });
  }

  const tokens = await r.json(); // { access_token, refresh_token, expires_in, ... }
  // TODO: store tokens securely (DB/KV). For now, just show success.
  return NextResponse.json({
    ok: true,
    tokens: {
      hasAccess: !!tokens.access_token,
      hasRefresh: !!tokens.refresh_token,
    },
  });
}
