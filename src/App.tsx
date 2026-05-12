import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Github,
  Globe,
  Loader2,
  Play,
  Search,
  ShieldOff,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';

import { DEMO_REPORT } from './walker/demo';
import { runWalk } from './walker/runner';
import type { CheckResult, WalkReport } from './walker/types';

const REPO_URL = 'https://github.com/mizcausevic-dev/well-known-walker-web';
const SUITE_URL = 'https://github.com/mizcausevic-dev/kinetic-gain-protocol-suite';

const STATUS_META: Record<
  CheckResult['status'],
  { label: string; tone: string; icon: typeof CheckCircle2 }
> = {
  found: { label: 'FOUND', tone: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
  not_found: { label: 'not found', tone: 'bg-slate-100 text-slate-600 border-slate-200', icon: X },
  parse_error: { label: 'parse error', tone: 'bg-amber-100 text-amber-800 border-amber-300', icon: AlertTriangle },
  version_mismatch: { label: 'wrong shape', tone: 'bg-amber-100 text-amber-800 border-amber-300', icon: AlertTriangle },
  cors_blocked: { label: 'CORS blocked', tone: 'bg-orange-100 text-orange-800 border-orange-300', icon: ShieldOff },
  network_error: { label: 'network error', tone: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  pending: { label: 'pending', tone: 'bg-slate-100 text-slate-600 border-slate-200', icon: Loader2 },
  skipped: { label: 'skipped', tone: 'bg-slate-100 text-slate-500 border-slate-200', icon: X },
};

const SAMPLE_DOMAINS = [
  'mizcausevic-dev.github.io',
  'edu.kineticgain.com',
  'kineticgain.com',
  'lincoln-high-district-42.edu',
];

export default function App() {
  const [input, setInput] = useState('');
  const [report, setReport] = useState<WalkReport | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleWalk(domain?: string) {
    const target = (domain ?? input).trim();
    if (!target) return;
    setRunning(true);
    setError(null);
    setReport(null);
    try {
      const r = await runWalk(target);
      setReport(r);
      setInput(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
      setTimeout(() => {
        document.getElementById('report')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }

  function loadDemo() {
    setReport(DEMO_REPORT);
    setInput(DEMO_REPORT.origin.replace(/^https?:\/\//, ''));
    setError(null);
    setTimeout(() => {
      document.getElementById('report')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <Hero
        input={input}
        setInput={setInput}
        onSubmit={() => handleWalk()}
        running={running}
        onDemo={loadDemo}
      />
      <main className="flex-1">
        <Samples onPick={(d) => { setInput(d); handleWalk(d); }} />
        {error && <ErrorBanner message={error} />}
        {report && <ReportSection report={report} />}
        {!report && !error && <CorsExplainer />}
      </main>
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 text-slate-900">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-violet-400 flex items-center justify-center shadow-sm">
            <Search size={20} />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-sm">well-known-walker</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 code">
              walker.kineticgain.com
            </div>
          </div>
        </a>
        <div className="flex items-center gap-4">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
          >
            <Github size={16} /> Repo
          </a>
          <a
            href={SUITE_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
          >
            <Sparkles size={16} /> Kinetic Gain Suite
          </a>
        </div>
      </div>
    </nav>
  );
}

function Hero({
  input,
  setInput,
  onSubmit,
  running,
  onDemo,
}: {
  input: string;
  setInput: (s: string) => void;
  onSubmit: () => void;
  running: boolean;
  onDemo: () => void;
}) {
  return (
    <header className="bg-gradient-to-b from-violet-50 to-white border-b border-slate-200">
      <div className="max-w-3xl mx-auto px-4 py-14 text-center">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest bg-violet-100 text-violet-700 border border-violet-200 mb-5 code">
          v0.1 · browser-side · no backend
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight mb-4">
          What <em className="text-violet-600 not-italic">disclosures</em><br />
          does this domain publish?
        </h1>
        <p className="text-slate-600 leading-relaxed max-w-2xl mx-auto text-lg mb-8">
          Type a domain. We probe every Kinetic Gain Protocol Suite well-known URL
          (<code className="code text-slate-700">/.well-known/aeo.json</code>,{' '}
          <code className="code text-slate-700">/.well-known/ai-aup.json</code>,{' '}
          <code className="code text-slate-700">/.well-known/ai-incidents.json</code>) and
          report what's there. Everything runs in your browser.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto"
        >
          <div className="flex-1 flex items-center bg-white border-2 border-slate-300 rounded-lg px-3 focus-within:border-violet-500 transition-colors">
            <Globe size={16} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="edu.kineticgain.com"
              spellCheck={false}
              className="flex-1 px-3 py-3 bg-transparent outline-none text-sm code placeholder:text-slate-400"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={running || !input.trim()}
            className="px-5 py-3 rounded-lg bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
          >
            {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {running ? 'Walking…' : 'Walk'}
          </button>
        </form>
        <button
          onClick={onDemo}
          className="mt-4 text-xs text-slate-500 hover:text-slate-900 underline underline-offset-2"
          type="button"
        >
          Or load the canned demo report ↗
        </button>
      </div>
    </header>
  );
}

function Samples({ onPick }: { onPick: (s: string) => void }) {
  return (
    <section className="bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 py-5 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-xs uppercase tracking-widest text-slate-500 font-bold code mr-1">
          try:
        </span>
        {SAMPLE_DOMAINS.map((d) => (
          <button
            key={d}
            onClick={() => onPick(d)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200 hover:border-violet-400 hover:bg-violet-50 transition-colors code"
          >
            {d}
          </button>
        ))}
      </div>
    </section>
  );
}

function CorsExplainer() {
  return (
    <section className="bg-slate-50 border-b border-slate-200">
      <div className="max-w-3xl mx-auto px-4 py-12 text-sm text-slate-600 leading-relaxed">
        <h2 className="text-lg font-bold text-slate-900 mb-3">How it works</h2>
        <ol className="space-y-2 list-decimal list-inside">
          <li>
            You type a domain. We send a browser <code className="code">fetch()</code> to
            three Kinetic Gain well-known URLs in parallel.
          </li>
          <li>
            For each fetch, we report: <code className="code">found</code> (valid JSON with
            the right version field), <code className="code">not found</code> (404),{' '}
            <code className="code">CORS blocked</code> (the target domain didn't send{' '}
            <code className="code">Access-Control-Allow-Origin</code>), or{' '}
            <code className="code">network error</code>.
          </li>
          <li>
            For each <code className="code">found</code> document, we extract a procurement-grade
            summary: entity identity, claim count, policy scope, incident count, audit mode.
          </li>
        </ol>
        <p className="mt-4 px-4 py-3 bg-amber-50 border-l-4 border-amber-400 rounded">
          <strong className="text-amber-900">CORS reality:</strong> most domains don't yet
          send permissive CORS headers on <code className="code">/.well-known/</code> paths,
          so cross-origin walks from a browser will often show{' '}
          <code className="code">CORS blocked</code>. That's not the walker failing — that's
          the target domain not opting in to public discovery. For a server-side walk that
          bypasses CORS entirely, see the upcoming{' '}
          <a
            href="https://github.com/mizcausevic-dev/well-known-walker"
            className="text-amber-900 underline"
            target="_blank"
            rel="noreferrer"
          >
            CLI version
          </a>
          .
        </p>
      </div>
    </section>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <section className="bg-red-50 border-b border-red-200">
      <div className="max-w-3xl mx-auto px-4 py-6 text-sm text-red-800 flex items-start gap-3">
        <XCircle size={18} className="flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold">Couldn't run the walk</div>
          <div className="mt-1">{message}</div>
        </div>
      </div>
    </section>
  );
}

function ReportSection({ report }: { report: WalkReport }) {
  const corsCount = report.results.filter((r) => r.status === 'cors_blocked').length;
  return (
    <section id="report" className="bg-slate-50 border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
              Walk report
            </h2>
            <p className="text-slate-600 text-sm">
              target:{' '}
              <code className="code text-slate-800">{report.origin}</code> · ran at{' '}
              <span className="code">{report.ran_at}</span> ·{' '}
              {report.duration_ms.toLocaleString()} ms
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-extrabold code text-violet-700">
              {report.found_count}<span className="text-slate-400 text-3xl">/{report.total_checks}</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">
              disclosures found
            </div>
          </div>
        </div>

        {corsCount > 0 && (
          <div className="mb-6 rounded-xl bg-orange-50 border-2 border-orange-200 p-4 text-sm text-orange-900 flex items-start gap-3">
            <ShieldOff size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold mb-0.5">{corsCount} check{corsCount === 1 ? '' : 's'} blocked by CORS</div>
              <div className="text-orange-800">
                The target domain didn't send permissive{' '}
                <code className="code">Access-Control-Allow-Origin</code> headers on these
                paths. The documents may still exist — they just can't be read by a browser
                from another origin. Use the upcoming CLI version for a server-side walk.
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {report.results.map((r) => (
            <ResultCard key={r.path} result={r} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ResultCard({ result }: { result: CheckResult }) {
  const meta = STATUS_META[result.status];
  const Icon = meta.icon;
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-100">
        <div>
          <div className="font-semibold text-slate-900">{result.label}</div>
          <a
            href={result.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs code text-slate-500 hover:text-slate-900 break-all"
          >
            {result.url} <ExternalLink size={10} className="inline" />
          </a>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] uppercase tracking-wider font-bold ${meta.tone}`}
        >
          <Icon size={12} />
          {meta.label}
          {result.detected_version && (
            <span className="ml-1 px-1.5 py-0.5 rounded bg-white/60 text-slate-700">
              v{result.detected_version}
            </span>
          )}
        </span>
      </div>
      {(result.summary?.length || result.message) && (
        <div className="px-5 py-3 text-sm bg-slate-50">
          {result.summary && result.summary.length > 0 && (
            <ul className="space-y-0.5 text-slate-700">
              {result.summary.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-emerald-600">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          )}
          {result.message && (
            <div className="text-slate-600 text-xs code break-all whitespace-pre-wrap">
              {result.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-6">
      <div className="max-w-5xl mx-auto px-4 text-xs text-slate-500 flex flex-wrap items-center gap-3">
        <span>
          <strong className="text-slate-700">well-known-walker</strong> v0.1 ·
          client-side · no transcript leaves your browser
        </span>
        <span className="text-slate-300">·</span>
        <a className="hover:text-slate-900 inline-flex items-center gap-1" href={REPO_URL} target="_blank" rel="noreferrer">
          GitHub <ExternalLink size={11} />
        </a>
        <a className="hover:text-slate-900 inline-flex items-center gap-1" href={SUITE_URL} target="_blank" rel="noreferrer">
          Kinetic Gain Suite <ExternalLink size={11} />
        </a>
        <a className="hover:text-slate-900" href="https://kineticgain.com" target="_blank" rel="noreferrer">
          kineticgain.com
        </a>
        <a className="hover:text-slate-900" href="https://www.linkedin.com/in/mirzacausevic/" target="_blank" rel="noreferrer">
          LinkedIn
        </a>
      </div>
    </footer>
  );
}
