import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { scanFile } from "@/lib/virus-scan";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { isDocumentSizeAllowed } from "@/lib/billing";
import { checkRateLimit, createRateLimitIdentifier } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth();

    // Check rate limits (20 uploads per hour per user)
    const rateLimitId = createRateLimitIdentifier(req, user.id);
    const rateLimit = checkRateLimit(rateLimitId, 20, 60 * 60 * 1000); // 20 per hour
    
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({
        error: 'rate_limit_exceeded',
        message: 'Too many upload requests. Please try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      }), { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
        }
      });
    }

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

    // Check billing entitlements for file size
    const sizeCheck = await isDocumentSizeAllowed(user, file.size);
    if (!sizeCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: "file_size_exceeded", 
        message: sizeCheck.reason 
      }), { status: 413 });
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

    // Create audit log
    await createAuditLog({
      userId: user.id,
      documentId: document.id,
      action: AuditActions.DOCUMENT_UPLOADED,
      details: {
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        category,
        orgId: defaultOrg.id
      },
      request: req
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
