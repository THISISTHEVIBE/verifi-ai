export type AnalysisResponse = {
  id: string;
  documentId: string;
  status: 'COMPLETED' | 'ERROR';
  riskScore: number;
  summary: string;
  findings: Array<{
    type: "RISK" | "COMPLIANCE" | "LEGAL" | "FINANCIAL" | "OPERATIONAL";
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    title: string;
    description: string;
    location?: string;
    suggestion?: string;
  }>;
  completedAt: Date;
};

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export async function uploadDocument(file: File, category?: string) {
  const form = new FormData();
  form.append('file', file);
  if (category) form.append('category', category);

  const res = await fetch(`${API_BASE}/api/documents`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return res.json() as Promise<{ id: string; filename: string; size: number; type: string; category?: string; status: string; uploadedAt: string }>;
}

export async function startAnalysis(params: { documentId: string; documentName: string; category?: string }) {
  const res = await fetch(`${API_BASE}/api/analysis`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Analysis failed (${res.status})`);
  return res.json() as Promise<AnalysisResponse>;
}

export async function postMetricEvent(event: any) {
  try {
    await fetch(`${API_BASE}/api/metrics`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(event),
      credentials: 'include',
    });
  } catch (e) {
    // best-effort
    console.warn('Failed to post metric event', e);
  }
}
