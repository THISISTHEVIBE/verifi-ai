import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { scanFile } from "@/lib/virus-scan";

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth();

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response(JSON.stringify({ error: "expected_multipart_form_data" }), { status: 400 });
    }
    const form = await req.formData();
    const file = form.get("file");
    const category = form.get("category") || "contract";

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: "file_missing" }), { status: 400 });
    }

    // Validate file size (50MB max for contracts)
    const maxBytes = 50 * 1024 * 1024;
    if (file.size > maxBytes) {
      return new Response(JSON.stringify({ error: "file_too_large", maxBytes }), { status: 413 });
    }

    // Validate file type (PDF and DOCX for contracts)
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword"
    ];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ 
        error: "unsupported_type", 
        allowed: ["PDF", "DOCX", "DOC"],
        received: file.type 
      }), { status: 415 });
    }

    // Convert file to buffer for virus scanning
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Virus scan (stub for now)
    const scanResult = await scanFile(buffer, file.name);
    if (!scanResult.isClean) {
      return new Response(JSON.stringify({ 
        error: "virus_detected", 
        threats: scanResult.threats 
      }), { status: 400 });
    }

    // Store file using storage service
    const storedFile = await storage.uploadFile(file, file.name, file.type);

    // Get user's default org
    const defaultOrg = user.defaultOrg;
    if (!defaultOrg) {
      return new Response(JSON.stringify({ error: "no_default_org" }), { status: 400 });
    }

    // Persist document record to database
    const document = await db.document.create({
      data: {
        orgId: defaultOrg.id,
        uploaderId: user.id,
        filename: storedFile.id,
        originalName: file.name,
        path: storedFile.path,
        size: file.size,
        mimeType: file.type,
        status: "UPLOADED"
      }
    });

    return new Response(
      JSON.stringify({
        id: document.id,
        filename: document.originalName,
        size: document.size,
        type: document.mimeType,
        category,
        status: document.status,
        uploadedAt: document.createdAt
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (e) {
    console.error("Document upload failed:", e);
    return new Response(JSON.stringify({ error: "upload_failed" }), { status: 500 });
  }
}
