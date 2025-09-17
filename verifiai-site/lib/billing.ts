// Billing and entitlement utilities
import { db } from "./db";
import { AuthenticatedUser } from "./auth-utils";

export interface EntitlementLimits {
  maxAnalysesPerMonth: number | null; // null = unlimited
  maxDocumentSize: number; // in bytes
  hasExportAccess: boolean;
  hasPrioritySupport: boolean;
  hasAdvancedAnalytics: boolean;
}

/**
 * Get entitlement limits for a user's organization
 */
export async function getEntitlementLimits(user: AuthenticatedUser): Promise<EntitlementLimits> {
  const defaultOrg = user.defaultOrg;
  if (!defaultOrg) {
    return getFreeEntitlements();
  }

  // Get subscription for the organization
  const subscription = await db.subscription.findFirst({
    where: { orgId: defaultOrg.id }
  });

  if (!subscription || subscription.status !== 'ACTIVE') {
    return getFreeEntitlements();
  }

  switch (subscription.plan) {
    case 'PAY_PER_CONTRACT':
      return {
        maxAnalysesPerMonth: null, // Pay per use
        maxDocumentSize: 50 * 1024 * 1024, // 50MB
        hasExportAccess: true,
        hasPrioritySupport: false,
        hasAdvancedAnalytics: false,
      };
    
    case 'PROFESSIONAL':
      return {
        maxAnalysesPerMonth: 100,
        maxDocumentSize: 100 * 1024 * 1024, // 100MB
        hasExportAccess: true,
        hasPrioritySupport: true,
        hasAdvancedAnalytics: true,
      };
    
    case 'ENTERPRISE':
      return {
        maxAnalysesPerMonth: null, // Unlimited
        maxDocumentSize: 500 * 1024 * 1024, // 500MB
        hasExportAccess: true,
        hasPrioritySupport: true,
        hasAdvancedAnalytics: true,
      };
    
    default:
      return getFreeEntitlements();
  }
}

/**
 * Get free tier entitlements
 */
function getFreeEntitlements(): EntitlementLimits {
  return {
    maxAnalysesPerMonth: 3, // 3 free analyses per month
    maxDocumentSize: 10 * 1024 * 1024, // 10MB
    hasExportAccess: false,
    hasPrioritySupport: false,
    hasAdvancedAnalytics: false,
  };
}

/**
 * Check if user can perform an analysis
 */
export async function canPerformAnalysis(user: AuthenticatedUser): Promise<{ allowed: boolean; reason?: string }> {
  const limits = await getEntitlementLimits(user);
  
  // If unlimited analyses, allow
  if (limits.maxAnalysesPerMonth === null) {
    return { allowed: true };
  }

  // Check monthly usage
  const defaultOrg = user.defaultOrg;
  if (!defaultOrg) {
    return { allowed: false, reason: "No organization found" };
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyAnalyses = await db.analysis.count({
    where: {
      document: { orgId: defaultOrg.id },
      createdAt: { gte: startOfMonth },
      status: { in: ['COMPLETED', 'PROCESSING'] } // Count both completed and in-progress
    }
  });

  if (monthlyAnalyses >= limits.maxAnalysesPerMonth) {
    return { 
      allowed: false, 
      reason: `Monthly limit of ${limits.maxAnalysesPerMonth} analyses reached. Upgrade your plan for more analyses.` 
    };
  }

  return { allowed: true };
}

/**
 * Check if user can export reports
 */
export async function canExportReports(user: AuthenticatedUser): Promise<{ allowed: boolean; reason?: string }> {
  const limits = await getEntitlementLimits(user);
  
  if (!limits.hasExportAccess) {
    return { 
      allowed: false, 
      reason: "Export access requires a paid plan. Please upgrade to access report exports." 
    };
  }

  return { allowed: true };
}

/**
 * Check if document size is within limits
 */
export async function isDocumentSizeAllowed(user: AuthenticatedUser, fileSize: number): Promise<{ allowed: boolean; reason?: string }> {
  const limits = await getEntitlementLimits(user);
  
  if (fileSize > limits.maxDocumentSize) {
    const maxSizeMB = Math.round(limits.maxDocumentSize / (1024 * 1024));
    const fileSizeMB = Math.round(fileSize / (1024 * 1024));
    return { 
      allowed: false, 
      reason: `File size ${fileSizeMB}MB exceeds limit of ${maxSizeMB}MB for your plan. Please upgrade for larger file support.` 
    };
  }

  return { allowed: true };
}

/**
 * Get subscription status for an organization
 */
export async function getSubscriptionStatus(orgId: string) {
  const subscription = await db.subscription.findFirst({
    where: { orgId }
  });

  return {
    hasActiveSubscription: subscription?.status === 'ACTIVE',
    plan: subscription?.plan || 'FREE',
    status: subscription?.status || 'INACTIVE',
    currentPeriodEnd: subscription?.currentPeriodEnd,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
  };
}
