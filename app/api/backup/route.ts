import path from "node:path";
import { NextResponse } from "next/server";

import { createBackup } from "@/lib/backup/backup";
import { errorResponse, guardOwner } from "@/lib/http/guard";

export async function POST(request: Request) {
  const denied = await guardOwner(request);
  if (denied) return denied;
  try {
    const file = createBackup();
    return NextResponse.json({
      fileName: path.basename(file),
      warning: "This is a database file backup outside the public web directory. Store the data folder on an encrypted volume. It is not a substitute for application authentication.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
