import { NextRequest } from "next/server";

// TODO: replace with queue + provider calls
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentId, documentName, category } = body || {};
    if (!documentId) {
      return new Response(JSON.stringify({ error: "documentId_required" }), { status: 400 });
    }

    // Simulate an analysis result for MVP scaffold
    const startedAt = Date.now();
    const completedAt = startedAt + 1500;
    const outcome = "verified" as const;
    const confidence = 87;

    const findings = [
      { type: "termination", risk: "medium", summary: "Kündigungsfrist 3 Monate zum Quartalsende" },
      { type: "renewal", risk: "low", summary: "Automatische Verlängerung um 12 Monate" },
      { type: "liability", risk: "high", summary: "Haftung auf 1x Jahresgebühr begrenzt" },
      { type: "payment", risk: "low", summary: "Zahlungsziel 30 Tage netto" },
    ];

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
