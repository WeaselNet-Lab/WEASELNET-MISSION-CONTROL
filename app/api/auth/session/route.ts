import { NextResponse } from "next/server";

import { guardOwner } from "@/lib/http/guard";
import { ownerUsername } from "@/lib/auth/account";

export async function GET(request: Request) {
  const denied = await guardOwner(request);
  if (denied) return denied;
  return NextResponse.json({ authenticated: true, username: ownerUsername() });
}
