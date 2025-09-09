export type AnalysisResponse = {
  id: string;
  documentId: string;
  documentName: string;
  category?: string;
  outcome: 'verified' | 'unverified' | 'suspicious' | 'failed';
  confidence: number;
  findings: Array<{ type: string; risk: 'low' | 'medium' | 'high'; summary: string }>;
  startedAt: number;
  completedAt: number;
};

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export async function uploadDocument(file: File, category?: string) {
  const form = new FormData();
  form.append('file', file);
  if (category) form.append('category', category);

  const res = await fetch(`${API_BASE}/api/documents`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return res.json() as Promise<{ id: string; name: string; size: number; type: string; category?: string }>;
}

export async function startAnalysis(params: { documentId: string; documentName: string; category?: string }) {
  const res = await fetch(`${API_BASE}/api/analysis`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
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
    });
  } catch (e) {
    // best-effort
    console.warn('Failed to post metric event', e);
  }
}
