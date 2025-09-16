import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { analyzeContract } from "@/lib/ai/analyzeContract";
import { db } from "@/lib/db";

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

    // Start contract analysis
    const analysisResult = await analyzeContract({
      documentId,
      documentName: documentName || document.originalName,
      category: category || "contract",
      text
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
