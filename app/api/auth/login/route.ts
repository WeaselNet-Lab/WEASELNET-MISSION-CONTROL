import { NextResponse } from "next/server";

import { authenticateOwner } from "@/lib/auth/account";
import { createSession, CSRF_COOKIE, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/auth/session";
import { cookieSecure, loopbackAllowed, sameOrigin } from "@/lib/http/boundary";
import { ensureReady } from "@/lib/db/ready";

export async function POST(request: Request) {
  ensureReady();
  const url = new URL(request.url);
  if (!loopbackAllowed(request.headers.get("host"))) {
    return NextResponse.json({ error: "This prototype stays on loopback." }, { status: 403 });
  }
  if (
    !sameOrigin({
      origin: request.headers.get("origin"),
      protocol: url.protocol,
      host: request.headers.get("host") ?? "",
    })
  ) {
    return NextResponse.json({ error: "Cross-origin sign-in rejected." }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as { username?: unknown; password?: unknown } | null;
  const username = typeof body?.username === "string" ? body.username : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!authenticateOwner(username, password)) {
    return NextResponse.json({ error: "Sign-in failed." }, { status: 401 });
  }
  const session = createSession();
  const response = NextResponse.json({ ok: true });
  const secure = cookieSecure(url.protocol);
  response.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  response.cookies.set(CSRF_COOKIE, session.csrf, {
    httpOnly: false,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
