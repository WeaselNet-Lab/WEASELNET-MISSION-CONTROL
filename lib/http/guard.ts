import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { decideOwnerAccess, decideVisitorAccess } from "@/lib/auth/access-decision";
import { CSRF_COOKIE, readSession, sessionAcceptsCsrf, SESSION_COOKIE } from "@/lib/auth/session";
import { ensureReady } from "@/lib/db/ready";
import { RevisionConflictError, ValidationError } from "@/lib/db/validate";

export async function guardOwner(request: Request) {
  ensureReady();
  const url = new URL(request.url);
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value ?? null;
  const csrfCookie = cookieStore.get(CSRF_COOKIE)?.value ?? "";
  const csrfHeader = request.headers.get("x-csrf-token") ?? "";
  const decision = decideOwnerAccess({
    host: request.headers.get("host"),
    method: request.method,
    origin: request.headers.get("origin"),
    protocol: url.protocol,
    requestHost: request.headers.get("host") ?? "",
    hasSession: Boolean(readSession(token)),
    csrfOk: Boolean(token && csrfCookie && csrfHeader === csrfCookie && sessionAcceptsCsrf(token, csrfHeader)),
  });
  if (!decision.ok) {
    return NextResponse.json({ error: decision.error }, { status: decision.status });
  }
  return null;
}

export function guardVisitor(request: Request) {
  ensureReady();
  const decision = decideVisitorAccess(request.headers.get("host"));
  if (!decision.ok) return NextResponse.json({ error: decision.error }, { status: decision.status });
  return null;
}

export function errorResponse(error: unknown) {
  if (error instanceof RevisionConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  console.error("request failed", error instanceof Error ? error.name : "unknown");
  return NextResponse.json({ error: "The request could not be completed." }, { status: 500 });
}
