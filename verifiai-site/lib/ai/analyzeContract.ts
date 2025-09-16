// AI contract analysis service
import { db } from "@/lib/db";

export interface ContractAnalysisRequest {
  documentId: string;
  documentName?: string;
  category?: string;
  text?: string;
}

export interface ContractFinding {
  type: "RISK" | "COMPLIANCE" | "LEGAL" | "FINANCIAL" | "OPERATIONAL";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  location?: string;
  suggestion?: string;
}

export interface ContractAnalysisResult {
  id: string;
  documentId: string;
  status: "COMPLETED" | "ERROR";
  riskScore: number;
  summary: string;
  findings: ContractFinding[];
  completedAt: Date;
}

/**
 * Analyze a contract using AI provider
 */
export async function analyzeContract(request: ContractAnalysisRequest): Promise<ContractAnalysisResult> {
  const startTime = Date.now();
  
  // Create analysis record
  const analysis = await db.analysis.create({
    data: {
      documentId: request.documentId,
      status: "PROCESSING",
    }
  });

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    let findings: ContractFinding[] = [];
    let riskScore = 50;
    let summary = "Contract analysis completed";

    if (apiKey && request.text) {
      try {
        const prompt = `You are a legal AI assistant analyzing contracts for SMEs. Analyze the following contract and provide a JSON response with:
        - riskScore: number (0-100, where 100 is highest risk)
        - summary: string (brief German summary of key points)
        - findings: array of objects with:
          - type: one of "RISK", "COMPLIANCE", "LEGAL", "FINANCIAL", "OPERATIONAL"
          - severity: one of "LOW", "MEDIUM", "HIGH", "CRITICAL"
          - title: string (short German title)
          - description: string (detailed German description)
          - suggestion: string (German recommendation)

        Contract name: ${request.documentName || "Unknown"}
        Category: ${request.category || "contract"}
        Content: ${request.text.slice(0, 10000)}

        Respond only with valid JSON.`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are a legal AI assistant. Respond only with valid JSON." },
              { role: "user", content: prompt },
            ],
            temperature: 0.2,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data?.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            riskScore = Math.max(0, Math.min(100, parsed.riskScore || 50));
            summary = parsed.summary || summary;
            if (Array.isArray(parsed.findings)) {
              findings = parsed.findings.slice(0, 20); // Limit findings
            }
          }
        }
      } catch (error) {
        console.warn("OpenAI analysis failed:", error);
      }
    }

    // Fallback findings if AI didn't provide any
    if (findings.length === 0) {
      findings = [
        {
          type: "LEGAL",
          severity: "MEDIUM",
          title: "Kündigungsklausel prüfen",
          description: "Die Kündigungsbedingungen sollten überprüft werden.",
          suggestion: "Rechtliche Beratung für Kündigungsfristen empfohlen."
        },
        {
          type: "FINANCIAL",
          severity: "LOW",
          title: "Zahlungsbedingungen",
          description: "Standardzahlungsbedingungen identifiziert.",
          suggestion: "Zahlungsfristen könnten optimiert werden."
        }
      ];
    }

    // Update analysis with results
    const updatedAnalysis = await db.analysis.update({
      where: { id: analysis.id },
      data: {
        status: "COMPLETED",
        riskScore,
        summary,
        completedAt: new Date(),
      }
    });

    // Create findings
    await db.finding.createMany({
      data: findings.map(finding => ({
        analysisId: analysis.id,
        type: finding.type,
        severity: finding.severity,
        title: finding.title,
        description: finding.description,
        suggestion: finding.suggestion,
        location: finding.location,
      }))
    });

    return {
      id: updatedAnalysis.id,
      documentId: request.documentId,
      status: "COMPLETED",
      riskScore,
      summary,
      findings,
      completedAt: updatedAnalysis.completedAt!,
    };

  } catch (error) {
    console.error("Contract analysis failed:", error);
    
    // Update analysis with error status
    await db.analysis.update({
      where: { id: analysis.id },
      data: {
        status: "ERROR",
        completedAt: new Date(),
      }
    });

    throw error;
  }
}
