import { NextResponse } from "next/server";

import { loadOperatorState, saveOperatorState } from "@/lib/db/operator-store";
import { errorResponse, guardOwner } from "@/lib/http/guard";

export async function GET(request: Request) {
  const denied = await guardOwner(request);
  if (denied) return denied;
  const operator = loadOperatorState();
  return NextResponse.json(operator);
}

export async function PUT(request: Request) {
  const denied = await guardOwner(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as { revision?: unknown; state?: unknown };
    if (typeof body.revision !== "number") {
      return NextResponse.json({ error: "A revision is required." }, { status: 400 });
    }
    return NextResponse.json(saveOperatorState(body.state, body.revision));
  } catch (error) {
    return errorResponse(error);
  }
}
