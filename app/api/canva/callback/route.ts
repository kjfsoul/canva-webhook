import { NextRequest, NextResponse } from "next/server";

const TOKEN_URL = "https://www.canva.com/api/oauth/token"\;
const CLIENT_ID = process.env.CANVA_CLIENT_ID!;
const REDIRECT_URI =
  process.env.CANVA_REDIRECT_URI ??
  "https://canva-webhook.vercel.app/api/canva/callback"\;

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
};

function isTokenResponse(x: unknown): x is TokenResponse {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  // Only check keys we care about; types are permissive but not 'any'
  const okType = (v: unknown) =>
    v === undefined || typeof v === "string" || typeof v === "number";
  return (
    okType(o["access_token"]) &&
    okType(o["refresh_token"]) &&
    okType(o["expires_in"]) &&
    okType(o["scope"]) &&
    okType(o["token_type"])
  );
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("oauth_state")?.value;
  const verifier = req.cookies.get("pkce_verifier")?.value;

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
      accept: "application/json",
    },
    body,
  });

  const text = await r.text();
  if (!r.ok) {
    return new NextResponse(`token exchange failed: ${text}`, { status: 400 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // If Canva ever returns non-JSON with 200 (unlikely), just echo it
    return new NextResponse(text, { status: 200 });
  }

  if (!isTokenResponse(parsed)) {
    return new NextResponse("token exchange failed: unexpected payload", { status: 400 });
  }

  // TODO: store tokens securely (DB/KV). For now, confirm success minimally.
  return NextResponse.json({
    ok: true,
    tokens: {
      hasAccess: Boolean(parsed.access_token),
      hasRefresh: Boolean(parsed.refresh_token),
    },
  });
}
