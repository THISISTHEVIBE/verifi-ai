import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { analyzeContract } from "@/lib/ai/analyzeContract";
import { db } from "@/lib/db";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth();
    const body = await req.json();
    const { documentId, documentName, category, text } = body || {};

    // Basic input validation
    if (typeof documentId !== "string" || documentId.trim().length === 0) {
      return new Response(JSON.stringify({ 
        error: "validation_failed", 
        message: "documentId must be a non-empty string" 
      }), { status: 400 });
    }

    // Verify document exists and user has access
    const document = await db.document.findFirst({
      where: {
        id: documentId,
        org: {
          members: {
            some: {
              userId: user.id
            }
          }
        }
      },
      include: {
        org: true
      }
    });

    if (!document) {
      return new Response(JSON.stringify({ 
        error: "document_not_found",
        message: "Document not found or access denied" 
      }), { status: 404 });
    }

    // Check if analysis already exists
    const existingAnalysis = await db.analysis.findFirst({
      where: { documentId },
      include: { findings: true }
    });

    if (existingAnalysis && existingAnalysis.status === "COMPLETED") {
      return new Response(JSON.stringify({
        id: existingAnalysis.id,
        documentId,
        status: existingAnalysis.status,
        riskScore: existingAnalysis.riskScore,
        summary: existingAnalysis.summary,
        findings: existingAnalysis.findings,
        completedAt: existingAnalysis.completedAt
      }), { status: 200 });
    }

    // Create audit log for analysis start
    await createAuditLog({
      userId: user.id,
      documentId,
      action: AuditActions.ANALYSIS_STARTED,
      details: {
        documentName: documentName || document.originalName,
        category: category || "contract",
        orgId: document.orgId
      },
      request: req
    });

    // Start contract analysis
    const analysisResult = await analyzeContract({
      documentId,
      documentName: documentName || document.originalName,
      category: category || "contract",
      text
    });

    // Create audit log for analysis completion
    await createAuditLog({
      userId: user.id,
      documentId,
      action: analysisResult.status === "COMPLETED" ? AuditActions.ANALYSIS_COMPLETED : AuditActions.ANALYSIS_FAILED,
      details: {
        analysisId: analysisResult.id,
        riskScore: analysisResult.riskScore,
        findingsCount: analysisResult.findings?.length || 0,
        orgId: document.orgId
      },
      request: req
    });

    return new Response(
      JSON.stringify(analysisResult),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (e) {
    console.error("Analysis failed:", e);
    return new Response(JSON.stringify({ 
      error: "analysis_failed",
      message: "Failed to analyze document" 
    }), { status: 500 });
  }
}
