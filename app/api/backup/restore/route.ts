import { NextResponse } from "next/server";

import { restoreBackup } from "@/lib/backup/backup";
import { errorResponse, guardOwner } from "@/lib/http/guard";

export async function POST(request: Request) {
  const denied = await guardOwner(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as { fileName?: unknown; confirm?: unknown };
    if (body.confirm !== "RESTORE") {
      return NextResponse.json({ error: "Type RESTORE to replace the local database with a backup." }, { status: 400 });
    }
    if (typeof body.fileName !== "string") {
      return NextResponse.json({ error: "A backup file name is required." }, { status: 400 });
    }
    restoreBackup(body.fileName);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
