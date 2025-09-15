import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { NextRequest } from "next/server";
import { db } from "./db";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  orgMemberships: Array<{
    id: string;
    role: string;
    org: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  defaultOrg?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface AuthenticatedSession {
  user: AuthenticatedUser;
}

/**
 * Get authenticated session for API routes
 * Returns null if user is not authenticated
 */
export async function getAuthenticatedSession(): Promise<AuthenticatedSession | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }

  // Get user from database with org memberships
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    include: {
      orgMemberships: {
        include: {
          org: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const defaultOrg = user.orgMemberships.find(m => m.role === "OWNER")?.org || user.orgMemberships[0]?.org;

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      image: user.image || undefined,
      orgMemberships: user.orgMemberships.map(m => ({
        id: m.id,
        role: m.role,
        org: m.org,
      })),
      defaultOrg,
    },
  };
}

/**
 * Require authentication for API routes
 * Throws 401 error if user is not authenticated
 */
export async function requireAuth(): Promise<AuthenticatedSession> {
  const session = await getAuthenticatedSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }
  
  return session;
}

/**
 * Check if user has access to a specific org
 */
export function hasOrgAccess(user: AuthenticatedUser, orgId: string): boolean {
  return user.orgMemberships.some(m => m.org.id === orgId);
}

/**
 * Check if user has a specific role in an org
 */
export function hasOrgRole(user: AuthenticatedUser, orgId: string, role: string): boolean {
  return user.orgMemberships.some(m => m.org.id === orgId && m.role === role);
}

/**
 * Get user's role in a specific org
 */
export function getUserOrgRole(user: AuthenticatedUser, orgId: string): string | null {
  const membership = user.orgMemberships.find(m => m.org.id === orgId);
  return membership?.role || null;
}
