"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Briefcase,
  Building2,
  Calendar,
  Check,
  Cloud,
  Cpu,
  Database,
  FileText,
  Globe,
  Hammer,
  Languages,
  Linkedin,
  Mail,
  Scale,
  Shield,
  ShoppingBasket,
  Timer,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// ---- Utility components ----
function Section({ id, children, className = "" }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`container mx-auto px-4 py-20 ${className}`}>
      {children}
    </section>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/50 px-3 py-1 text-xs text-slate-200">
      {children}
    </span>
  );
}

const gradientBg =
  "bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(56,189,248,0.15),transparent),radial-gradient(800px_400px_at_90%_10%,rgba(16,185,129,0.12),transparent),radial-gradient(800px_400px_at_10%_20%,rgba(168,85,247,0.10),transparent)]";

// ---- Main App ----
export default function VerifiAI() {
  const [activeTab, setActiveTab] = useState("mvp");

  return (
    <div className={`min-h-screen ${gradientBg} bg-gradient-to-b from-slate-950 via-slate-950 to-black text-slate-100`}> 
      <Nav />
      <Hero />
      <TrustBar />
      <Section id="problem">
        <ProblemSolution />
      </Section>
      <Section id="produkt" className="pt-0">
        <ProductTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </Section>
      <Section id="pricing" className="pt-0">
        <Pricing />
      </Section>
      <Section id="zielgruppe" className="pt-0">
        <TargetAudiences />
      </Section>
      <Section id="gtm" className="pt-0">
        <GoToMarket />
      </Section>
      <Section id="tech" className="pt-0">
        <TeamTechSecurity />
      </Section>
      <Section id="faq" className="pt-0">
        <FAQ />
      </Section>
      <CTA />
      <Footer />
    </div>
  );
}

// ---- Navbar ----
function Nav() {
  const { data: session, status } = useSession();
  return (
    <div className="sticky top-0 z-50 w-full border-b border-slate-800/60 bg-slate-950/70 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <a href="#top" className="flex items-center gap-2">
          <Logo />
          <span className="text-lg font-semibold tracking-tight">Verifi AI</span>
        </a>
        <nav className="hidden items-center gap-6 md:flex">
          <a href="#produkt" className="text-slate-300 hover:text-white">Produkt</a>
          <a href="#pricing" className="text-slate-300 hover:text-white">Preise</a>
          <a href="#gtm" className="text-slate-300 hover:text-white">Go‑to‑Market</a>
          <a href="#tech" className="text-slate-300 hover:text-white">Tech</a>
          <a href="#faq" className="text-slate-300 hover:text-white">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          {status === "authenticated" && session?.user ? (
            <div className="flex items-center gap-3">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt={session.user.name ?? session.user.email ?? "user"} className="h-7 w-7 rounded-full border border-slate-700" />
              ) : null}
              <span className="hidden text-sm text-slate-300 sm:inline">{session.user.name ?? session.user.email}</span>
              <Button size="sm" variant="outline" className="border-slate-700 text-slate-200" onClick={() => signOut()}>Sign out</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="border-slate-700 text-slate-200" onClick={() => signIn("github")}>Sign in with GitHub</Button>
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400" onClick={() => signIn("google")}>Sign in with Google</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="relative h-6 w-6">
      <svg viewBox="0 0 200 200" className="h-6 w-6">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <path d="M100 10 C55 10 20 45 20 90 s35 80 80 80 s80 -35 80 -80 S145 10 100 10 z" fill="url(#g)" />
        <path d="M70 100 l20 20 l40 -50" stroke="black" strokeOpacity="0.7" strokeWidth="14" fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <path d="M70 100 l20 20 l40 -50" stroke="white" strokeWidth="8" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ---- Hero ----
function Hero() {
  return (
    <Section id="top" className="relative py-24">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-300">
            <BadgeCheck className="h-4 w-4" />
            AI‑gestützte Vertragsanalyse für KMUs
          </div>
          <h1 className="mt-2 bg-gradient-to-b from-white to-slate-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
            Verträge prüfen in Minuten, nicht Wochen.
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            Verifi AI markiert automatisch Risiken, Fristen und Verhandlungspunkte in Miet‑, Arbeits‑ und Lieferverträgen –
            verständlich erklärt und sofort umsetzbar.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 gap-2 bg-emerald-500 px-6 text-base hover:bg-emerald-400">
              <a href="#cta">Jetzt Beta sichern</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 gap-2 border-slate-700 px-6 text-base text-slate-200">
              <a href="#produkt" className="inline-flex items-center gap-2">
                So funktioniert’s <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Shield className="h-4 w-4" /> DSGVO‑konform • EU Data Residency • Kein Ersatz für Rechtsberatung
          </div>
        </div>
      </motion.div>
    </Section>
  );
}

// ---- Trust Bar ----
function TrustBar() {
  return (
    <div className="border-y border-slate-800/60 bg-slate-900/30">
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-6 px-4 py-6 opacity-80">
        <Pill>KMU‑fokussiert</Pill>
        <Pill>Explainable AI</Pill>
        <Pill>1‑Klick Upload</Pill>
        <Pill>Fristen‑Kalender</Pill>
        <Pill>Risk Scoring</Pill>
        <Pill>Integrationen</Pill>
      </div>
    </div>
  );
}

// ---- Problem & Solution ----
function ProblemSolution() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-200">
            <Scale className="h-5 w-5" /> Problem
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-slate-300">
          <p>KMUs unterschreiben Verträge oft blind und übersehen kritische Klauseln:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Kündigungsfristen & automatische Verlängerungen</li>
            <li>Haftungsbegrenzungen & Gewährleistungsausschlüsse</li>
            <li>Ungünstige Zahlungsbedingungen</li>
          </ul>
          <p className="text-slate-400">Folge: Kosten, Rechtsstreitigkeiten und verlorene Verhandlungsmacht.</p>
        </CardContent>
      </Card>
      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-200">
            <Badge className="bg-emerald-600">Lösung</Badge> Verifi AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-slate-300">
          <ul className="grid gap-3">
            <li className="flex items-start gap-2"><Check className="mt-0.5 h-5 w-5 text-emerald-400" /> Automatische Markierung von Risiken, Fristen und Verhandlungspunkten</li>
            <li className="flex items-start gap-2"><Check className="mt-0.5 h-5 w-5 text-emerald-400" /> Risiko‑Score (grün → rot) mit Erklärungen & Zitaten aus dem Vertrag</li>
            <li className="flex items-start gap-2"><Check className="mt-0.5 h-5 w-5 text-emerald-400" /> Fristen‑Kalender & Reminder fürs Team</li>
            <li className="flex items-start gap-2"><Check className="mt-0.5 h-5 w-5 text-emerald-400" /> 1‑Klick Upload (PDF/DOCX) – kein Training nötig</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Product Tabs (MVP & Roadmap) ----
function Feature({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <Card className="border-slate-800 bg-slate-900/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-200">
          <Icon className="h-5 w-5 text-sky-300" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-slate-300">{desc}</CardContent>
    </Card>
  );
}

function ProductTabs({ activeTab, onTabChange }: { activeTab: string; onTabChange: (value: string) => void }) {
  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Produkt</h2>
        <p className="mt-2 text-slate-300">Start als Fokus‑MVP, klare Roadmap zur EU‑weiten Lösung.</p>
      </div>
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <div className="flex w-full justify-center">
          <TabsList className="mb-6 bg-slate-900/60">
            <TabsTrigger value="mvp">MVP (0–6 Monate)</TabsTrigger>
            <TabsTrigger value="roadmap">V2 / Roadmap</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="mvp">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Feature icon={Upload} title="Upload PDFs/DOCX" desc="Einfach hochladen – der Contract Parser extrahiert relevante Klauseln und Metadaten." />
            <Feature icon={Timer} title="Kündigungsfristen" desc="Automatische Erkennung inkl. Erinnerung im Fristen‑Kalender." />
            <Feature icon={Calendar} title="Automatische Verlängerung" desc="Renewal‑Klauseln werden markiert und rechtzeitig signalisiert." />
            <Feature icon={Scale} title="Haftung" desc="Haftungsbeschränkungen, Gewährleistung & Limitierungen transparent gemacht." />
            <Feature icon={Banknote} title="Zahlungsbedingungen" desc="Zahlungsziele, Skonto, Mahngebühren – alles im Blick." />
            <Feature icon={Shield} title="Risiko‑Scoring" desc="Ampel‑Logik (grün→rot) mit Begründung und Verlinkung zur Textstelle." />
          </div>
          <Card className="mt-6 border-slate-800 bg-slate-900/60">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6 text-slate-300">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>Dashboard mit Fristen‑Kalender & Team‑Reminder</span>
              </div>
              <Button asChild className="bg-emerald-500 hover:bg-emerald-400">
                <a href="#cta" className="inline-flex items-center gap-2">MVP testen <ArrowRight className="h-4 w-4" /></a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="roadmap">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Feature icon={Languages} title="Multi‑Language (DE/EN/FR)" desc="EU‑weit einsatzfähig für KMUs mit internationalen Verträgen." />
            <Feature icon={WorkflowIcon} title="Verhandlungsvorschläge" desc="Automatisch bessere Klauseln vorschlagen – direkt im Kontext." />
            <Feature icon={Globe} title="Integrationen" desc="DocuSign, Google Drive, MS Teams – nahtlos im Arbeitsfluss." />
            <Feature icon={BarIcon} title="Benchmarking" desc="‚80% deiner Branche haben bessere Zahlungsziele‘ – datenbasierte Insights." />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WorkflowIcon(props: any) {
  return <Cpu {...props} />;
}
function BarIcon(props: any) {
  return <Database {...props} />;
}

// ---- Pricing ----
function Pricing() {
  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Preise</h2>
        <p className="mt-2 text-slate-300">SaaS für KMUs – transparent und fair.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-slate-800 bg-slate-900/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Pay‑per‑Contract</CardTitle>
              <Badge className="bg-sky-600">Flexibel</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-4xl font-bold">€29<span className="text-base font-normal text-slate-400"> pro Upload</span></div>
            <ul className="mb-6 space-y-2 text-slate-300">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Vollständiger Vertrags‑Check</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Risiko‑Score & Erklärungen</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> PDF‑Report Download</li>
            </ul>
            <Button asChild className="w-full bg-emerald-500 hover:bg-emerald-400">
              <a href="#cta">Jetzt starten</a>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">SMB Subscription</CardTitle>
              <Badge className="bg-emerald-600">Beliebt</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-4xl font-bold">€99<span className="text-base font-normal text-slate-400"> / Monat</span></div>
            <ul className="mb-6 space-y-2 text-slate-300">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> 20 Verträge / Monat</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Fristen‑Kalender & Team‑Reminder</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Integrationen & API‑Zugang</li>
            </ul>
            <Button asChild className="w-full bg-emerald-500 hover:bg-emerald-400">
              <a href="#cta">Abo anfragen</a>
            </Button>
          </CardContent>
        </Card>
      </div>
      <p className="mt-4 text-center text-xs text-slate-400">Upsell: Compliance‑Module (GDPR, ESG, Lieferkettengesetz) • White‑Label für Banken/Versicherer</p>
    </div>
  );
}

// ---- Zielgruppe ----
function TargetAudiences() {
  const chips = [
    { icon: Briefcase, label: "Startups (Arbeits‑ & SaaS‑Verträge)" },
    { icon: Hammer, label: "Bau/Handwerk (Miet‑ & Lieferverträge)" },
    { icon: ShoppingBasket, label: "E‑Commerce (Supplier, Plattform‑AGBs)" },
    { icon: Building2, label: "KMUs 10–500 MA ohne Legal‑Team" },
  ];
  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Zielgruppe</h2>
        <p className="mt-2 text-slate-300">Wir bauen für kleine und mittlere Unternehmen.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {chips.map((c, i) => (
          <span key={i} className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm text-slate-200">
            <c.icon className="h-4 w-4" /> {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---- Go To Market ----
function GoToMarket() {
  const steps = [
    {
      title: "Beta‑Launch",
      desc: "Startup‑ & KMU‑Communities (LinkedIn, Product Hunt, Gründer‑Events).",
    },
    { title: "Channel Partner", desc: "Steuerberater & Buchhaltung (DATEV, Lexoffice, Xero)." },
    { title: "Content Marketing", desc: "Blog: ‚10 gefährlichste Klauseln in Mietverträgen‘." },
    { title: "Freemium Funnel", desc: "1 Gratis‑Check → Abo anbieten." },
  ];
  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Go‑to‑Market</h2>
        <p className="mt-2 text-slate-300">Schneller Impact durch fokussierten Rollout.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <Card key={i} className="border-slate-800 bg-slate-900/60">
            <CardHeader>
              <CardTitle className="text-slate-200">{i + 1}. {s.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">{s.desc}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---- Team, Tech & Security ----
function TeamTechSecurity() {
  return (
    <div className="space-y-12">
      <div>
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Team & Tech</h2>
          <p className="mt-2 text-slate-300">Pragmatischer Stack, auf Wachstum ausgelegt.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-slate-800 bg-slate-900/60">
            <CardHeader>
              <CardTitle className="text-slate-200">Team</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <ul className="space-y-2">
                <li><Check className="mr-2 inline h-4 w-4 text-emerald-400" /> Founder (Legal/Compliance)</li>
                <li><Check className="mr-2 inline h-4 w-4 text-emerald-400" /> 2× AI Engineers (LLM/NLP)</li>
                <li><Check className="mr-2 inline h-4 w-4 text-emerald-400" /> Backend Engineer (API/Security)</li>
                <li><Check className="mr-2 inline h-4 w-4 text-emerald-400" /> Frontend Engineer (Dashboard/UX)</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/60">
            <CardHeader>
              <CardTitle className="text-slate-200">Stack</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <ul className="space-y-2">
                <li className="flex items-center gap-2"><Cpu className="h-4 w-4 text-sky-300" /> LLM: GPT‑4/5 oder Llama 3 (finetuned)</li>
                <li className="flex items-center gap-2"><Cloud className="h-4 w-4 text-sky-300" /> Backend: Python + FastAPI</li>
                <li className="flex items-center gap-2"><Database className="h-4 w-4 text-sky-300" /> Storage: Postgres + Vector DB (pgvector/weaviate)</li>
                <li className="flex items-center gap-2"><Globe className="h-4 w-4 text-sky-300" /> Frontend: React + Tailwind</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/60">
            <CardHeader>
              <CardTitle className="text-slate-200">Security & Compliance</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <ul className="space-y-2">
                <li className="flex items-center gap-2"><Shield className="h-4 w-4 text-sky-300" /> EU Data Residency (AWS/GCP, Region EU)</li>
                <li className="flex items-center gap-2"><Shield className="h-4 w-4 text-sky-300" /> Verschlüsselung at‑rest & in‑transit</li>
                <li className="flex items-center gap-2"><Shield className="h-4 w-4 text-sky-300" /> Rollenbasierte Zugriffe, Audit Logs</li>
                <li className="flex items-center gap-2"><Shield className="h-4 w-4 text-sky-300" /> Klarer Hinweis: Keine Rechtsberatung</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Finanzierung</h2>
          <p className="mt-2 text-slate-300">Klarer Fahrplan: MVP → Seed → Skalierung.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-slate-800 bg-slate-900/60">
            <CardHeader>
              <CardTitle className="text-slate-200">MVP Need</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">€1 – 1.5M (6–9 Monate Runway)</CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/60">
            <CardHeader>
              <CardTitle className="text-slate-200">Seed Ziel</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">€4–5M → Internationalisierung, 1000+ zahlende Kunden, AI Fine‑Tuning</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---- FAQ ----
function FAQ() {
  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight">FAQ</h2>
        <p className="mt-2 text-slate-300">Häufige Fragen – klar beantwortet.</p>
      </div>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1" className="border-slate-800">
          <AccordionTrigger>Ersetzt Verifi AI eine Rechtsberatung?</AccordionTrigger>
          <AccordionContent className="text-slate-300">
            Nein. Verifi AI ist ein Analysetool, kein Rechtsrat. Wir markieren Risiken, verlinken Stellen und geben Hinweise – die rechtliche Bewertung bleibt Anwalts‑Sache.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2" className="border-slate-800">
          <AccordionTrigger>Wie funktioniert das Risiko‑Scoring?</AccordionTrigger>
          <AccordionContent className="text-slate-300">
            Ein gewichteter Score bewertet Klausel‑Risiken (z. B. Haftung, Verlängerung, Zahlungsziele). Jede Bewertung ist erklärbar und führt zur Originalstelle.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3" className="border-slate-800">
          <AccordionTrigger>Sind meine Daten sicher?</AccordionTrigger>
          <AccordionContent className="text-slate-300">
            Ja. EU‑basierte Speicherung, Transport‑/Ruhe‑Verschlüsselung, rollenbasierte Zugriffe und Audit Logs. Optional dedizierte Mandanteninstanzen.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-4" className="border-slate-800">
          <AccordionTrigger>Welche Dateiformate werden unterstützt?</AccordionTrigger>
          <AccordionContent className="text-slate-300">
            Zum Start PDF & DOCX. Weitere Formate folgen mit der Roadmap.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

// ---- Call to Action ----
function CTA() {
  return (
    <div id="cta" className="border-y border-slate-800/60 bg-slate-900/40">
      <Section id="cta" className="py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h3 className="text-3xl font-bold tracking-tight">Beta anfragen & 1 Gratis‑Check sichern</h3>
          <p className="mt-2 text-slate-300">Hinterlasse deine E‑Mail – wir melden uns mit Zugang zur Closed Beta.</p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 gap-2 bg-emerald-500 px-6 text-base hover:bg-emerald-400">
              <a href="mailto:hello@verifiai.app?subject=Beta%20Anfrage%20Verifi%20AI&body=Hi%20Verifi%20AI%20Team,%0D%0Aich%20m%C3%B6chte%20an%20der%20Closed%20Beta%20teilnehmen.%20Unsere%20Firma%20...">Per Mail anfragen</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 gap-2 border-slate-700 px-6 text-base text-slate-200">
              <a href="#pricing" className="inline-flex items-center gap-2">
                Preise ansehen <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
}

// ---- Footer ----
function Footer() {
  return (
    <footer className="container mx-auto px-4 py-10 text-sm text-slate-400">
      <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-medium text-slate-200">Verifi AI</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <a className="inline-flex items-center gap-1 hover:text-slate-200" href="mailto:hello@verifiai.app"><Mail className="h-4 w-4" /> hello@verifiai.app</a>
          <a className="inline-flex items-center gap-1 hover:text-slate-200" href="#"><Linkedin className="h-4 w-4" /> LinkedIn</a>
          <a className="inline-flex items-center gap-1 hover:text-slate-200" href="/imprint"><Globe className="h-4 w-4" /> Impressum</a>
          <a className="inline-flex items-center gap-1 hover:text-slate-200" href="/privacy">Datenschutz</a>
          <a className="inline-flex items-center gap-1 hover:text-slate-200" href="/terms">AGB</a>
          <a className="inline-flex items-center gap-1 hover:text-slate-200" href="/security">Sicherheit</a>
        </div>
      </div>
      <Separator className="my-6 bg-slate-800" />
      <p className="text-center text-xs text-slate-500">
        {new Date().getFullYear()} Verifi AI • Kein Ersatz für Rechtsberatung • Alle Preise zzgl. USt.
      </p>
    </footer>
  );
}
