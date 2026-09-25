import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { CSRF_COOKIE, destroySession, SESSION_COOKIE } from "@/lib/auth/session";
import { cookieSecure, loopbackAllowed, sameOrigin } from "@/lib/http/boundary";
import { guardOwner } from "@/lib/http/guard";

export async function POST(request: Request) {
  const denied = await guardOwner(request);
  if (denied) return denied;
  const url = new URL(request.url);
  if (
    !loopbackAllowed(request.headers.get("host")) ||
    !sameOrigin({
      origin: request.headers.get("origin"),
      protocol: url.protocol,
      host: request.headers.get("host") ?? "",
    })
  ) {
    return NextResponse.json({ error: "Sign-out rejected." }, { status: 403 });
  }
  const cookieStore = await cookies();
  destroySession(cookieStore.get(SESSION_COOKIE)?.value);
  const response = NextResponse.json({ ok: true });
  const secure = cookieSecure(url.protocol);
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 0 });
  response.cookies.set(CSRF_COOKIE, "", { httpOnly: false, sameSite: "lax", secure, path: "/", maxAge: 0 });
  return response;
}
