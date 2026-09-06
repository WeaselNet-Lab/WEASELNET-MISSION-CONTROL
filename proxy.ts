import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isDevelopmentPreviewAllowed } from "@/lib/workspaces/access";

/**
 * Fail closed: development workspace previews never ship as a production bypass.
 * Next.js 16 file convention: proxy (formerly middleware).
 *
 * Host checking is defense-in-depth only. Prefer binding `npm run dev` to 127.0.0.1.
 * This is not authentication.
 */
export function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/dev")) {
    return NextResponse.next();
  }

  const allowed = isDevelopmentPreviewAllowed({
    nodeEnv: process.env.NODE_ENV,
    host: request.headers.get("host"),
    forwardedHost: request.headers.get("x-forwarded-host"),
  });

  if (!allowed) {
    return NextResponse.rewrite(new URL("/not-found", request.url));
  }

  return NextResponse.next();
}

// Matcher must be a static literal for Next.js compile-time parsing.
// Keep in sync with DEV_PREVIEW_PROXY_MATCHER in lib/workspaces/shell.ts.
export const config = {
  matcher: ["/dev/:path*"],
};
