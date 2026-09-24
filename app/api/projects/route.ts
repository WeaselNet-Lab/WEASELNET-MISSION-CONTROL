import { NextResponse } from "next/server";

import { createProject, type ProjectInput } from "@/lib/db/projects";
import { errorResponse, guardOwner } from "@/lib/http/guard";

export async function POST(request: Request) {
  const denied = await guardOwner(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as ProjectInput;
    const project = createProject(body);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
