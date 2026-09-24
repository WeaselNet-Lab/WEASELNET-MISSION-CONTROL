import { NextResponse } from "next/server";

import { guardVisitor } from "@/lib/http/guard";
import { readVisitorSnapshot } from "@/lib/visitor/snapshot";

export async function GET(request: Request) {
  const denied = guardVisitor(request);
  if (denied) return denied;
  return NextResponse.json(readVisitorSnapshot());
}
