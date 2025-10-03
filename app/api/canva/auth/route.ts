import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

const CANVA_AUTH = "https://www.canva.com/api/oauth/authorize";
const CLIENT_ID = process.env.CANVA_CLIENT_ID!;
const REDIRECT_URI =
  process.env.CANVA_REDIRECT_URI ??
  "https://canva-webhook.vercel.app/api/canva/callback";

function b64url(b: Buffer): string {
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function GET() {
  if (!CLIENT_ID) return new Response("Missing CANVA_CLIENT_ID", { status: 500 });

  const verifier = b64url(crypto.randomBytes(32));
  const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
  const state = b64url(crypto.randomBytes(16));

  const u = new URL(CANVA_AUTH);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", CLIENT_ID);
  u.searchParams.set("redirect_uri", REDIRECT_URI);
  u.searchParams.set("code_challenge_method", "S256");
  u.searchParams.set("code_challenge", challenge);
  u.searchParams.set("state", state);

  const res = NextResponse.redirect(u.toString(), { status: 307 });
  res.cookies.set("pkce_verifier", verifier, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  res.cookies.set("oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  return res;
}
