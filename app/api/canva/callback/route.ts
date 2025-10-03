import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const TOKEN_URL = "https://www.canva.com/api/oauth/token";
const CLIENT_ID = process.env.CANVA_CLIENT_ID!;
const REDIRECT_URI =
  process.env.CANVA_REDIRECT_URI ??
  "https://canva-webhook.vercel.app/api/canva/callback";

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
};

function isTokenResponse(val: unknown): val is TokenResponse {
  if (typeof val !== "object" || val === null) return false;
  const o = val as Record<string, unknown>;
  const isStr = (v: unknown) => typeof v === "string";
  const isNum = (v: unknown) => typeof v === "number";
  return (
    (o.access_token === undefined || isStr(o.access_token)) &&
    (o.refresh_token === undefined || isStr(o.refresh_token)) &&
    (o.expires_in === undefined || isNum(o.expires_in)) &&
    (o.scope === undefined || isStr(o.scope)) &&
    (o.token_type === undefined || isStr(o.token_type))
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

  const form = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  });

  const resp = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body: form,
  });

  const text = await resp.text();
  if (!resp.ok) {
    return new NextResponse(`token exchange failed: ${text}`, { status: 400 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return new NextResponse(text, { status: 200 });
  }

  if (!isTokenResponse(parsed)) {
    return new NextResponse("token exchange failed: unexpected payload", { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    tokens: {
      hasAccess: Boolean(parsed.access_token),
      hasRefresh: Boolean(parsed.refresh_token),
    },
  });
}
