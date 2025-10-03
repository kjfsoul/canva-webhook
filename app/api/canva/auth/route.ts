import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const CANVA_AUTH = "https://www.canva.com/api/oauth/authorize";
const CLIENT_ID = process.env.CANVA_CLIENT_ID!;
const REDIRECT_URI = "https://canva-webhook.vercel.app/api/canva/callback";

function base64url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function GET() {
  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(
    crypto.createHash("sha256").update(verifier).digest()
  );
  const state = base64url(crypto.randomBytes(16));

  const url = new URL(CANVA_AUTH);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("state", state);
  // store verifier/state in a cookie for the callback to read
  const res = NextResponse.redirect(url.toString());
  res.cookies.set("pkce_verifier", verifier, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });
  return res;
}
