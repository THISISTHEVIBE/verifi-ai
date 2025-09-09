import { NextRequest } from "next/server";

// TODO: replace with S3/GCS storage and virus scan
export async function POST(req: NextRequest) {
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
