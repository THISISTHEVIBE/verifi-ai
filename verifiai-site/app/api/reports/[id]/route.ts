import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { canExportReports } from "@/lib/billing";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth();
    const analysisId = params.id;
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'pdf';

    // Check billing entitlements for export access
    const exportCheck = await canExportReports(user);
    if (!exportCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: "export_not_allowed",
        message: exportCheck.reason 
      }), { status: 403 });
    }

    // Verify analysis exists and user has access
    const analysis = await db.analysis.findFirst({
      where: {
        id: analysisId,
        document: {
          org: {
            members: {
              some: {
                userId: user.id
              }
            }
          }
        }
      },
      include: {
        document: {
          include: {
            org: true,
            uploader: true
          }
        },
        findings: true
      }
    });

    if (!analysis) {
      return new Response(JSON.stringify({ 
        error: "analysis_not_found",
        message: "Analysis not found or access denied" 
      }), { status: 404 });
    }

    // Create audit log
    await createAuditLog({
      userId: user.id,
      documentId: analysis.document.id,
      action: AuditActions.REPORT_GENERATED,
      details: {
        analysisId: analysis.id,
        format,
        orgId: analysis.document.orgId
      },
      request: req
    });

    if (format === 'csv') {
      return generateCSVReport(analysis);
    } else {
      return generatePDFReport(analysis);
    }

  } catch (error) {
    console.error("Report generation failed:", error);
    return new Response(JSON.stringify({ 
      error: "report_failed",
      message: "Failed to generate report" 
    }), { status: 500 });
  }
}

function generateCSVReport(analysis: any): Response {
  const csvRows = [
    // Header
    ['Document', 'Analysis Date', 'Risk Score', 'Status', 'Finding Type', 'Severity', 'Title', 'Description', 'Suggestion'],
    // Data rows
    ...analysis.findings.map((finding: any) => [
      analysis.document.originalName,
      analysis.completedAt?.toISOString() || '',
      analysis.riskScore?.toString() || '',
      analysis.status,
      finding.type,
      finding.severity,
      finding.title,
      finding.description,
      finding.suggestion || ''
    ])
  ];

  // If no findings, add a summary row
  if (analysis.findings.length === 0) {
    csvRows.push([
      analysis.document.originalName,
      analysis.completedAt?.toISOString() || '',
      analysis.riskScore?.toString() || '',
      analysis.status,
      'SUMMARY',
      'INFO',
      'Analysis Complete',
      analysis.summary || 'No specific findings identified',
      ''
    ]);
  }

  const csvContent = csvRows
    .map(row => row.map((field: string) => `"${field.replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return new Response(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="analysis-${analysis.id}.csv"`
    }
  });
}

function generatePDFReport(analysis: any): Response {
  // Generate HTML content for PDF
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Contract Analysis Report</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      margin: 40px; 
      color: #333;
    }
    .header { 
      border-bottom: 2px solid #007acc; 
      padding-bottom: 20px; 
      margin-bottom: 30px;
    }
    .title { 
      font-size: 24px; 
      font-weight: bold; 
      color: #007acc;
      margin: 0;
    }
    .subtitle { 
      font-size: 14px; 
      color: #666; 
      margin: 5px 0 0 0;
    }
    .section { 
      margin-bottom: 30px; 
    }
    .section-title { 
      font-size: 18px; 
      font-weight: bold; 
      margin-bottom: 15px; 
      color: #007acc;
    }
    .info-grid { 
      display: grid; 
      grid-template-columns: 150px 1fr; 
      gap: 10px; 
      margin-bottom: 20px;
    }
    .info-label { 
      font-weight: bold; 
    }
    .risk-score { 
      font-size: 20px; 
      font-weight: bold; 
      padding: 10px; 
      border-radius: 5px; 
      text-align: center;
    }
    .risk-low { background-color: #d4edda; color: #155724; }
    .risk-medium { background-color: #fff3cd; color: #856404; }
    .risk-high { background-color: #f8d7da; color: #721c24; }
    .finding { 
      border: 1px solid #ddd; 
      border-radius: 5px; 
      padding: 15px; 
      margin-bottom: 15px;
    }
    .finding-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      margin-bottom: 10px;
    }
    .finding-title { 
      font-weight: bold; 
      font-size: 16px;
    }
    .severity-badge { 
      padding: 4px 8px; 
      border-radius: 3px; 
      font-size: 12px; 
      font-weight: bold;
    }
    .severity-LOW { background-color: #d4edda; color: #155724; }
    .severity-MEDIUM { background-color: #fff3cd; color: #856404; }
    .severity-HIGH { background-color: #f8d7da; color: #721c24; }
    .severity-CRITICAL { background-color: #721c24; color: white; }
    .finding-description { 
      margin-bottom: 10px; 
      line-height: 1.5;
    }
    .finding-suggestion { 
      background-color: #f8f9fa; 
      padding: 10px; 
      border-radius: 3px; 
      font-style: italic;
    }
    .footer { 
      margin-top: 40px; 
      padding-top: 20px; 
      border-top: 1px solid #ddd; 
      font-size: 12px; 
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">Contract Analysis Report</h1>
    <p class="subtitle">Generated by VerifiAI on ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="section">
    <h2 class="section-title">Document Information</h2>
    <div class="info-grid">
      <div class="info-label">Document:</div>
      <div>${analysis.document.originalName}</div>
      <div class="info-label">Organization:</div>
      <div>${analysis.document.org.name}</div>
      <div class="info-label">Uploaded by:</div>
      <div>${analysis.document.uploader.name || analysis.document.uploader.email}</div>
      <div class="info-label">Analysis Date:</div>
      <div>${analysis.completedAt?.toLocaleDateString() || 'N/A'}</div>
      <div class="info-label">Status:</div>
      <div>${analysis.status}</div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Risk Assessment</h2>
    <div class="risk-score ${getRiskClass(analysis.riskScore)}">
      Risk Score: ${analysis.riskScore || 'N/A'}/100
    </div>
    ${analysis.summary ? `<p><strong>Summary:</strong> ${analysis.summary}</p>` : ''}
  </div>

  <div class="section">
    <h2 class="section-title">Findings (${analysis.findings.length})</h2>
    ${analysis.findings.length > 0 ? 
      analysis.findings.map((finding: any) => `
        <div class="finding">
          <div class="finding-header">
            <div class="finding-title">${finding.title}</div>
            <div class="severity-badge severity-${finding.severity}">${finding.severity}</div>
          </div>
          <div class="finding-description">${finding.description}</div>
          ${finding.suggestion ? `<div class="finding-suggestion"><strong>Recommendation:</strong> ${finding.suggestion}</div>` : ''}
        </div>
      `).join('') : 
      '<p>No specific findings identified in this analysis.</p>'
    }
  </div>

  <div class="footer">
    <p>This report was generated automatically by VerifiAI. Please review all findings with qualified legal counsel.</p>
  </div>
</body>
</html>`;

  // For now, return HTML (in production, you'd convert this to PDF using a library like Puppeteer)
  return new Response(htmlContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="analysis-${analysis.id}.html"`
    }
  });
}

function getRiskClass(riskScore: number | null): string {
  if (!riskScore) return 'risk-low';
  if (riskScore <= 30) return 'risk-low';
  if (riskScore <= 70) return 'risk-medium';
  return 'risk-high';
}
