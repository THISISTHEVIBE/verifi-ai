// Audit logging utility
import { db } from "./db";
import { NextRequest } from "next/server";

export interface AuditLogData {
  userId?: string;
  documentId?: string;
  action: string;
  details?: any;
  request?: NextRequest;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    // Extract IP and user agent from request if provided
    let ipAddress: string | undefined;
    let userAgent: string | undefined;
    
    if (data.request) {
      ipAddress = getClientIP(data.request);
      userAgent = data.request.headers.get('user-agent') || undefined;
    }

    await db.auditLog.create({
      data: {
        userId: data.userId,
        documentId: data.documentId,
        action: data.action,
        details: data.details ? JSON.parse(JSON.stringify(data.details)) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Don't throw errors for audit logging failures
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Extract client IP from request headers
 */
function getClientIP(request: NextRequest): string | undefined {
  // Try various headers that might contain the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return undefined;
}

/**
 * Common audit actions
 */
export const AuditActions = {
  DOCUMENT_UPLOADED: 'document_uploaded',
  DOCUMENT_DELETED: 'document_deleted',
  ANALYSIS_STARTED: 'analysis_started',
  ANALYSIS_COMPLETED: 'analysis_completed',
  ANALYSIS_FAILED: 'analysis_failed',
  USER_SIGNIN: 'user_signin',
  USER_SIGNOUT: 'user_signout',
  ORG_CREATED: 'org_created',
  ORG_MEMBER_ADDED: 'org_member_added',
  ORG_MEMBER_REMOVED: 'org_member_removed',
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_UPDATED: 'subscription_updated',
  REPORT_GENERATED: 'report_generated',
} as const;
