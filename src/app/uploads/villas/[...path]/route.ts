import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

const uploadRoot = path.resolve(process.cwd(), "public", "uploads", "villas");

function getSafeContentType(segments: string[]) {
  const fileName = segments[segments.length - 1]?.toLowerCase() ?? "";

  if (fileName.endsWith(".webp")) {
    return "image/webp";
  }

  if (fileName.endsWith(".pdf")) {
    return "application/pdf";
  }

  return null;
}

function isSafeUploadPath(segments: string[]) {
  return (
    segments.length >= 2 &&
    segments.every((segment) => segment && segment !== "." && segment !== "..") &&
    Boolean(getSafeContentType(segments))
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const { path: pathSegments } = await context.params;

  if (!isSafeUploadPath(pathSegments)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const contentType = getSafeContentType(pathSegments);
  const targetPath = path.resolve(uploadRoot, ...pathSegments);

  if (!targetPath.startsWith(`${uploadRoot}${path.sep}`)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const file = await readFile(targetPath);

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentType ?? "application/octet-stream",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
