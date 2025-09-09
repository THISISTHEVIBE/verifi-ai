export default function SecurityPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-16 text-slate-200">
      <h1 className="mb-4 text-3xl font-bold">Security & Compliance</h1>
      <p className="text-slate-300">High-level overview of our planned security posture. Replace with detailed copy before launch.</p>
      <div className="mt-6 space-y-4 text-slate-300">
        <ul className="list-disc pl-6">
          <li>EU Data Residency (storage & processing)</li>
          <li>Encryption in transit (TLS) and at rest (KMS)</li>
          <li>Role-based access control and audit logging</li>
          <li>PII scrubbing in logs and traces</li>
          <li>Data retention and deletion on request</li>
        </ul>
        <p className="text-slate-400">Contact: hello@verifiai.app</p>
      </div>
    </main>
  );
}
