import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { analyzeContract } from "@/lib/ai/analyzeContract";
import { db } from "@/lib/db";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { canPerformAnalysis } from "@/lib/billing";
import { logger, measureTime, createRequestContext } from "@/lib/logger";
import { captureAPIError, captureUserContext, startPerformanceTransaction } from "@/lib/sentry";
import { checkRateLimit, createRateLimitIdentifier } from "@/lib/security";

export async function POST(req: NextRequest) {
  const transaction = startPerformanceTransaction('analysis.create', 'api');
  const requestContext = createRequestContext(req);
  let documentId: string | undefined;
  let category: string | undefined;
  
  try {
    logger.request(req, 'Analysis request started', requestContext);
    
    const { user } = await requireAuth();
    captureUserContext(user);
    
    // Check rate limits (10 analyses per hour per user)
    const rateLimitId = createRateLimitIdentifier(req, user.id);
    const rateLimit = checkRateLimit(rateLimitId, 10, 60 * 60 * 1000); // 10 per hour
    
    if (!rateLimit.allowed) {
      logger.warn('Rate limit exceeded for analysis', { 
        ...requestContext, 
        userId: user.id,
        remaining: rateLimit.remaining,
        resetTime: rateLimit.resetTime
      });
      
      return new Response(JSON.stringify({
        error: 'rate_limit_exceeded',
        message: 'Too many analysis requests. Please try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      }), { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
        }
      });
    }
    
    const body = await req.json();
    const parsedBody = body || {};
    documentId = parsedBody.documentId;
    const documentName = parsedBody.documentName;
    category = parsedBody.category;
    const text = parsedBody.text;
    
    const context = { ...requestContext, userId: user.id, documentId, category };

    // Basic input validation
    if (typeof documentId !== "string" || documentId.trim().length === 0) {
      return new Response(JSON.stringify({ 
        error: "validation_failed", 
        message: "documentId must be a non-empty string" 
      }), { status: 400 });
    }
    
    // Now documentId is guaranteed to be a non-empty string

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

    // Check billing entitlements
    const entitlementCheck = await canPerformAnalysis(user);
    if (!entitlementCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: "entitlement_exceeded",
        message: entitlementCheck.reason 
      }), { status: 403 });
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

    // Start contract analysis with performance monitoring
    const analysisResult = await measureTime(
      'contract_analysis',
      () => analyzeContract({
        documentId: documentId!, // We know it's valid from validation above
        documentName: documentName || document.originalName,
        category: category || "contract",
        text
      }),
      context
    );

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

    logger.info('Analysis completed successfully', { 
      ...context, 
      analysisId: analysisResult.id,
      riskScore: analysisResult.riskScore 
    });
    
    transaction.setStatus('ok');
    return new Response(
      JSON.stringify(analysisResult),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (e) {
    const error = e as Error;
    logger.requestError(req, "Analysis failed", error, requestContext);
    captureAPIError(error, req, { documentId: documentId || 'unknown', category: category || 'unknown' });
    transaction.setStatus('internal_error');
    
    return new Response(JSON.stringify({ 
      error: "analysis_failed",
      message: "Failed to analyze document" 
    }), { status: 500 });
  } finally {
    transaction.finish();
  }
}
