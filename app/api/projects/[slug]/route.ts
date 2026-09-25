import { NextResponse } from "next/server";

import { approveShowcase, archiveProject, getOwnerProjectBySlug, restoreProject, updateProject, type ProjectInput } from "@/lib/db/projects";
import { errorResponse, guardOwner } from "@/lib/http/guard";

type Context = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: Context) {
  const denied = await guardOwner(request);
  if (denied) return denied;
  const { slug } = await context.params;
  const project = getOwnerProjectBySlug(slug);
  if (!project) return NextResponse.json({ error: "Project was not found." }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(request: Request, context: Context) {
  const denied = await guardOwner(request);
  if (denied) return denied;
  const { slug } = await context.params;
  try {
    const body = (await request.json()) as { action?: string; revision?: number; project?: ProjectInput };
    if (body.action === "archive") return NextResponse.json(archiveProject(slug));
    if (body.action === "restore") return NextResponse.json(restoreProject(slug));
    if (body.action === "approve") return NextResponse.json(approveShowcase(slug));
    if (!body.project || typeof body.revision !== "number") {
      return NextResponse.json({ error: "A revision and project are required." }, { status: 400 });
    }
    return NextResponse.json(updateProject(slug, body.revision, body.project));
  } catch (error) {
    return errorResponse(error);
  }
}
