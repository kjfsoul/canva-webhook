import { NextResponse } from "next/server";
import crypto from "crypto";

const CANVA_AUTH = "https://www.canva.com/api/oauth/authorize"\;
const CLIENT_ID = process.env.CANVA_CLIENT_ID!;
const REDIRECT_URI = process.env.CANVA_REDIRECT_URI ?? "https://canva-webhook.vercel.app/api/canva/callback"\;

function b64url(b: Buffer) {
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function GET() {
  if (!CLIENT_ID) return new Response("Missing CANVA_CLIENT_ID", { status: 500 });

  const verifier = b64url(crypto.randomBytes(32));
  const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
  const state = b64url(crypto.randomBytes(16));

  const url = new URL(CANVA_AUTH);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("state", state);

  const res = NextResponse.redirect(url.toString());
  res.cookies.set("pkce_verifier", verifier, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  res.cookies.set("oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  return res;
}
