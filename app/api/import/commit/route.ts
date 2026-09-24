import { NextResponse } from "next/server";

import { commitExfil } from "@/lib/import/exfil";
import { errorResponse, guardOwner } from "@/lib/http/guard";

export async function POST(request: Request) {
  const denied = await guardOwner(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as { raw?: unknown; take?: unknown; checkpoint?: unknown };
    if (typeof body.raw !== "string") return NextResponse.json({ error: "An export file is required." }, { status: 400 });
    const take = Array.isArray(body.take) ? body.take.filter((item): item is string => typeof item === "string") : [];
    const checkpoint = body.checkpoint === "take-import" ? "take-import" : "keep";
    return NextResponse.json(commitExfil(body.raw, { take, checkpoint }));
  } catch (error) {
    return errorResponse(error);
  }
}
