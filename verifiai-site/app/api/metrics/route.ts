import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const { user } = await requireAuth();
    
    // Get user's organizations
    const orgIds = user.orgMemberships.map(m => m.org.id);
    
    // Get metrics for user's organizations
    const [
      totalDocuments,
      totalAnalyses,
      completedAnalyses,
      avgRiskScore,
      recentDocuments,
      riskDistribution
    ] = await Promise.all([
      // Total documents uploaded
      db.document.count({
        where: { orgId: { in: orgIds } }
      }),
      
      // Total analyses started
      db.analysis.count({
        where: { 
          document: { orgId: { in: orgIds } }
        }
      }),
      
      // Completed analyses
      db.analysis.count({
        where: { 
          document: { orgId: { in: orgIds } },
          status: "COMPLETED"
        }
      }),
      
      // Average risk score
      db.analysis.aggregate({
        where: { 
          document: { orgId: { in: orgIds } },
          status: "COMPLETED",
          riskScore: { not: null }
        },
        _avg: { riskScore: true }
      }),
      
      // Recent documents (last 30 days)
      db.document.count({
        where: { 
          orgId: { in: orgIds },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Risk score distribution
      db.analysis.groupBy({
        by: ['riskScore'],
        where: { 
          document: { orgId: { in: orgIds } },
          status: "COMPLETED",
          riskScore: { not: null }
        },
        _count: true
      })
    ]);

    return new Response(
      JSON.stringify({
        totalDocuments,
        totalAnalyses,
        completedAnalyses,
        avgRiskScore: avgRiskScore._avg.riskScore || 0,
        recentDocuments,
        successRate: totalAnalyses > 0 ? (completedAnalyses / totalAnalyses * 100) : 0,
        riskDistribution: {
          low: riskDistribution.filter(r => r.riskScore! <= 30).reduce((sum, r) => sum + r._count, 0),
          medium: riskDistribution.filter(r => r.riskScore! > 30 && r.riskScore! <= 70).reduce((sum, r) => sum + r._count, 0),
          high: riskDistribution.filter(r => r.riskScore! > 70).reduce((sum, r) => sum + r._count, 0)
        }
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (error) {
    console.error("Metrics fetch failed:", error);
    return new Response(JSON.stringify({ error: "metrics_failed" }), { status: 500 });
  }
}

