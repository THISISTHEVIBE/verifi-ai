"use client";

import { useEffect, useState } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem("verifiai:cookie-consent:v1");
      setVisible(!v);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[95%] max-w-3xl -translate-x-1/2 rounded-lg border border-slate-800 bg-slate-900/90 p-4 text-slate-200 shadow-xl backdrop-blur">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-slate-300">
          Wir verwenden technisch notwendige Cookies für die Funktionalität dieser Website. Siehe unsere {" "}
          <a href="/privacy" className="underline hover:text-white">Datenschutzerklärung</a>.
        </p>
        <div className="flex gap-2">
          <button
            className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
            onClick={() => {
              try { localStorage.setItem("verifiai:cookie-consent:v1", "denied"); } catch {}
              setVisible(false);
            }}
          >
            Ablehnen
          </button>
          <button
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm text-black hover:bg-emerald-400"
            onClick={() => {
              try { localStorage.setItem("verifiai:cookie-consent:v1", "accepted"); } catch {}
              setVisible(false);
            }}
          >
            Akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}
