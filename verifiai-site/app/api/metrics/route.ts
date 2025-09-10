import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Temporary in-memory store for demo; replace with DB in future steps
let demoEvents: any[] = [];

export async function GET() {
  const session = await getServerSession(authOptions as any);
  if (!session) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }
  return new Response(
    JSON.stringify({
      totalVerifications: demoEvents.length,
      events: demoEvents.slice(-100),
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any);
  if (!session) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "invalid_body" }), { status: 400 });
    }
    demoEvents.push({ ...body, ts: Date.now() });
    if (demoEvents.length > 10000) demoEvents = demoEvents.slice(-5000);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: "bad_json" }), { status: 400 });
  }
}
