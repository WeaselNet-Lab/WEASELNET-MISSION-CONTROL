import { NextResponse } from "next/server";

import { previewExfil } from "@/lib/import/exfil";
import { errorResponse, guardOwner } from "@/lib/http/guard";

export async function POST(request: Request) {
  const denied = await guardOwner(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as { raw?: unknown };
    if (typeof body.raw !== "string") return NextResponse.json({ error: "An export file is required." }, { status: 400 });
    return NextResponse.json(previewExfil(body.raw));
  } catch (error) {
    return errorResponse(error);
  }
}
