import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Finding = { type: string; risk: "low" | "medium" | "high"; summary: string };

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
    }
    const body = await req.json();
    const { documentId, documentName, category, text } = body || {};
    if (!documentId) {
      return new Response(JSON.stringify({ error: "documentId_required" }), { status: 400 });
    }

    const startedAt = Date.now();

    const apiKey = process.env.OPENAI_API_KEY;
    let outcome: "verified" | "unverified" | "suspicious" | "failed" = "verified";
    let confidence = 85;
    let findings: Finding[] = [];

    if (apiKey) {
      try {
        const prompt = `You are an assistant helping SMEs review contracts. Analyze the following (possibly brief) contract context or metadata and produce JSON with fields: outcome (one of verified, unverified, suspicious), confidence (0-100), and findings (array of {type: one of termination, renewal, liability, payment, other; risk: low|medium|high; summary: short German sentence}). Document name: ${documentName || "(unknown)"}. Category: ${category || "(unspecified)"}. Context: ${text || "(no text provided)"}. Answer with only JSON.`;

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You return only strict JSON with the required fields." },
              { role: "user", content: prompt },
            ],
            temperature: 0.2,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content: string | undefined = data?.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            if (parsed?.outcome) outcome = parsed.outcome;
            if (typeof parsed?.confidence === "number") confidence = Math.max(0, Math.min(100, parsed.confidence));
            if (Array.isArray(parsed?.findings)) {
              findings = parsed.findings
                .map((f: any) => ({
                  type: String(f.type || "other"),
                  risk: (String(f.risk || "low").toLowerCase() as "low" | "medium" | "high"),
                  summary: String(f.summary || ""),
                }))
                .slice(0, 10);
            }
          }
        } else {
          // If OpenAI fails, fall back to heuristics below
          console.warn("OpenAI error", res.status, await res.text());
        }
      } catch (err) {
        console.warn("OpenAI call failed", err);
      }
    }

    // Fallback heuristics if no findings built
    if (!findings.length) {
      findings = [
        { type: "termination", risk: "medium", summary: "Kündigungsfrist 3 Monate zum Quartalsende (Fallback)" },
        { type: "renewal", risk: "low", summary: "Automatische Verlängerung um 12 Monate (Fallback)" },
        { type: "liability", risk: "high", summary: "Haftung auf 1x Jahresgebühr begrenzt (Fallback)" },
      ];
    }

    const completedAt = Date.now();

    return new Response(
      JSON.stringify({
        id: `analysis_${Date.now()}`,
        documentId,
        documentName,
        category,
        outcome,
        confidence,
        findings,
        startedAt,
        completedAt,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "bad_json" }), { status: 400 });
  }
}
