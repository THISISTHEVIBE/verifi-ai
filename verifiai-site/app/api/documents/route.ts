import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// TODO: replace with S3/GCS storage and virus scan
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any);
  if (!session) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return new Response(JSON.stringify({ error: "expected_multipart_form_data" }), { status: 400 });
  }
  try {
    const form = await req.formData();
    const file = form.get("file");
    const category = form.get("category") || "unspecified";

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: "file_missing" }), { status: 400 });
    }

    // Basic validation for demo: only images up to 10MB
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      return new Response(JSON.stringify({ error: "file_too_large", maxBytes }), { status: 413 });
    }
    const allowed = ["image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) {
      return new Response(JSON.stringify({ error: "unsupported_type", allowed }), { status: 415 });
    }

    // For MVP scaffold, we don't persist. Echo minimal metadata.
    const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return new Response(
      JSON.stringify({ id, name: file.name, size: file.size, type: file.type, category }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "upload_failed" }), { status: 500 });
  }
}
