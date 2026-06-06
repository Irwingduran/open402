'use client';

import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { useEffect, useRef, useState } from 'react';

// ─── Telegram link handler ─────────────────────────────────────────────────────
function TelegramLinkHandler() {
  const [status, setStatus] = useState<'idle' | 'linking' | 'success' | 'error' | 'noauth'>('idle');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const telegramId = params.get('telegram_id');
    if (!telegramId) return;

    setStatus('linking');
    fetch('/api/telegram/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId }),
    }).then(async (res) => {
      if (res.status === 401) { setStatus('noauth'); return; }
      if (!res.ok) { setStatus('error'); return; }
      setStatus('success');
      const url = new URL(window.location.href);
      url.searchParams.delete('telegram_id');
      window.history.replaceState({}, '', url.toString());
    }).catch(() => setStatus('error'));
  }, []);

  if (status === 'idle') return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center text-xs font-mono border-b ${
      status === 'success' ? 'bg-green-light text-green border-green/20' :
      status === 'error' || status === 'noauth' ? 'bg-red-50 text-red-600 border-red-200' :
      'bg-amber-light text-amber border-amber/20'
    }`}>
      {status === 'linking' && 'Vinculando cuenta de Telegram...'}
      {status === 'success' && 'Cuenta de Telegram vinculada correctamente'}
      {status === 'error' && 'Error al vincular cuenta de Telegram'}
      {status === 'noauth' && 'Inicia sesión primero para vincular tu cuenta de Telegram'}
    </div>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      let cur = 0;
      const tick = () => {
        cur += Math.ceil(to / 40);
        if (cur >= to) { setVal(to); return; }
        setVal(cur);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      obs.disconnect();
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ─── Live agent feed ──────────────────────────────────────────────────────────
const FEED: { icon: string; label: string; amount: string; time: string; color: string }[] = [
  { icon: '⚡', label: 'Pago CFE ejecutado', amount: '$312.50 MXN', time: '09:05', color: '#3B6D11' },
  { icon: '🔗', label: 'x402 → CoinGecko API', amount: '$0.003 MXM', time: '09:06', color: '#185FA5' },
  { icon: '🔗', label: 'x402 → OpenAI API', amount: '$0.012 MXM', time: '09:08', color: '#185FA5' },
  { icon: '⚡', label: 'Pago Telmex ejecutado', amount: '$199.00 MXN', time: '09:15', color: '#3B6D11' },
  { icon: '🔗', label: 'x402 → Perplexity API', amount: '$0.007 MXM', time: '09:17', color: '#185FA5' },
  { icon: '🔔', label: 'Saldo bajo — recarga', amount: '200 créditos', time: '09:20', color: '#BA7517' },
];

function AgentFeed() {
  const [visible, setVisible] = useState<number[]>([]);
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      if (i >= FEED.length) { clearInterval(id); return; }
      setVisible(v => [...v, i++]);
    }, 550);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-1">
      {FEED.map((item, i) => (
        <div key={i}
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-black/[0.06] transition-all duration-300 ${
            visible.includes(i) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2.5'
          }`}
          style={{ background: 'rgba(0,0,0,0.03)' }}
        >
          <span className="text-sm">{item.icon}</span>
          <span className="flex-1 text-[11px] font-mono text-ink-3">{item.label}</span>
          <span className="text-[11px] font-mono font-bold" style={{ color: item.color }}>{item.amount}</span>
          <span className="text-[10px] font-mono text-ink-3">{item.time}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Flow step ────────────────────────────────────────────────────────────────
function FlowStep({ step, title, sub, delay }: { step: string; title: string; sub: string; delay: number }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { setShow(true); obs.disconnect(); }
      });
      if (ref.current) obs.observe(ref.current);
      return () => obs.disconnect();
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div ref={ref}
      className={`flex flex-col items-center gap-2 transition-all duration-450 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3.5'
      }`}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold font-mono border border-black/10 text-ink-3" style={{ background: 'rgba(0,0,0,0.03)' }}>
        {step}
      </div>
      <div className="text-center">
        <p className="text-xs font-medium text-ink m-0 mb-0.5">{title}</p>
        <p className="text-[10.5px] text-ink-3 m-0 leading-relaxed">{sub}</p>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [credits, setCredits] = useState(1000);
  const [burning, setBurning] = useState(false);

  const burn = () => {
    if (credits <= 0 || burning) return;
    setBurning(true);
    setTimeout(() => {
      setCredits(c => Math.max(0, c - Math.floor(Math.random() * 12 + 3)));
      setBurning(false);
    }, 700);
  };

  return (
    <div className="bg-white text-ink font-sans">

      <TelegramLinkHandler />

      {/* ── NAV ───────────────────────────────────── */}
      <div className="max-w-[680px] mx-auto px-5">
        <nav className="flex items-center justify-between py-5 pb-[18px] border-b border-black/10">
          <a href="/" className="font-mono text-sm font-medium tracking-tight no-underline text-ink">
            open<span className="text-amber">402</span>
          </a>
          <div className="flex items-center gap-5">
            <a href="#sdk" className="text-xs font-mono text-ink-3 no-underline hover:text-ink transition-colors">docs</a>
            <a href="#sdk" className="text-xs font-mono text-ink-3 no-underline hover:text-ink transition-colors">sdk</a>
            <a href="https://github.com" className="text-xs font-mono text-ink-3 no-underline hover:text-ink transition-colors">github</a>
            <SignedOut>
              <SignInButton>
                <button className="text-[11px] font-mono px-[14px] py-[7px] bg-ink text-white rounded cursor-pointer hover:bg-ink-2 transition-colors border-none">
                  crear agente →
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <a href="/dashboard" className="text-[11px] font-mono px-[14px] py-[7px] bg-ink text-white no-underline rounded hover:bg-ink-2 transition-colors">
                dashboard →
              </a>
            </SignedIn>
          </div>
        </nav>
      </div>

      {/* ── HERO ───────────────────────────────────── */}
      <section className="max-w-[680px] mx-auto px-5 py-[52px] pb-12 border-b border-black/10">
        <div className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] text-ink-3 border border-black/10 px-[10px] py-[4px] mb-6">
          <span className="w-[5px] h-[5px] rounded-full bg-amber flex-shrink-0" />
          x402 · arbitrum · latam-first
        </div>

        <h1 className="font-display text-[42px] leading-[1.05] tracking-tight text-ink m-0 mb-4">
          Tu agente paga.<br /><em className="italic text-amber not-italic">Tú controlas.</em>
        </h1>

        <p className="text-sm leading-relaxed text-ink-3 max-w-[480px] m-0 mb-7 font-[300]">
          Infraestructura financiera para la economía de agentes autónomos. APIs vía x402, servicios mexicanos (CFE, Telmex, Telcel) y pagos programados — sin wallets, sin llaves privadas, sin fricción.
        </p>

        <div className="flex gap-2.5 flex-wrap mb-9">
          <SignedOut>
            <SignInButton>
              <button className="font-mono text-[11px] px-5 py-2.5 bg-ink text-white cursor-pointer hover:bg-ink-2 transition-colors border-none tracking-[0.02em]">
                npm install @open402/agents →
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <a href="/dashboard" className="font-mono text-[11px] px-5 py-2.5 bg-ink text-white no-underline hover:bg-ink-2 transition-colors tracking-[0.02em]">
              Ir al Dashboard →
            </a>
          </SignedIn>
          <a href="#sdk" className="font-mono text-[11px] px-5 py-2.5 bg-transparent text-ink border border-black/10 no-underline cursor-pointer hover:border-ink transition-colors">
            ver docs
          </a>
          <a href="https://github.com" className="font-mono text-[11px] px-5 py-2.5 bg-transparent text-ink border border-black/10 no-underline cursor-pointer hover:border-ink transition-colors">
            ★ github
          </a>
        </div>

        <div className="grid grid-cols-3 border border-black/10">
          {[
            { n: 400, s: '+', l: 'servicios mexicanos' },
            { n: 1, s: '.5%', l: 'fee por transacción' },
            { n: 0, s: '', l: 'wallets para el usuario' },
          ].map(({ n, s, l }, i) => (
            <div key={l} className={`px-5 py-4 ${i < 2 ? 'border-r border-black/10' : ''}`}>
              <span className="font-mono text-xl font-medium text-ink block mb-1">
                <Counter to={n} />{s}
              </span>
              <span className="text-[11px] text-ink-3 tracking-[0.04em]">{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── SDK CODE ────────────────────────────────── */}
      <section id="sdk" className="max-w-[680px] mx-auto px-5 py-10 border-b border-black/10">
        <span className="font-mono text-[10px] tracking-[0.12em] text-ink-3 mb-5 block">sdk</span>

        <div className="border border-black/10 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-[10px] border-b border-black/10" style={{ background: '#f7f6f3' }}>
            <span className="font-mono text-[11px] text-ink-3">agent.ts</span>
            <span className="font-mono text-[10px] px-[9px] py-[3px] bg-green-light text-green border border-green/20">npm install @open402/agents</span>
          </div>
          <pre className="m-0 p-5 text-[11.5px] leading-relaxed font-mono text-ink overflow-x-auto" style={{ background: '#f7f6f3' }}>
{`// 1 — crear agente con política de gasto
const agent = await AgentX.create({
  apiKey: process.env.OPEN402_KEY,
  policy: {
    daily_cap_mxn: 2000,
    confirm_above_mxn: 800,
    services: ['cfe', 'telmex'],
  },
});

// 2a — pagar API vía x402 (Arbitrum)
await agent.payX402({ url: 'https://api.coingecko.com/v3/price' });

// 2b — pagar servicio mexicano
await agent.payService({ provider: 'cfe', reference: '123456789' });`}
          </pre>
        </div>

        <div className="grid grid-cols-3 border border-black/10 border-t-0">
          {[
            { t: 'Agentic Wallets MPC', d: 'Claves en AWS Nitro Enclaves. Nunca expuestas al LLM.' },
            { t: 'Audit trail on-chain', d: 'Cada tx x402 queda registrada en Arbitrum.' },
            { t: 'Dos canales, un SDK', d: 'x402 para APIs. Prontipagos para servicios MX.' },
          ].map(({ t, d }, i) => (
            <div key={t} className={`px-[18px] py-[14px] ${i < 2 ? 'border-r border-black/10' : ''}`}>
              <p className="text-[11.5px] font-medium text-ink m-0 mb-1">{t}</p>
              <p className="text-[11px] text-ink-3 m-0 font-[300]">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section className="max-w-[680px] mx-auto px-5 py-10 border-b border-black/10">
        <span className="font-mono text-[10px] tracking-[0.12em] text-ink-3 mb-5 block">el flujo</span>

        <h2 className="font-display text-[22px] text-ink m-0 mb-1">De pesos a pagos en segundos</h2>
        <p className="text-sm text-ink-3 font-[300] m-0 mb-6">Sin crypto visible. Sin wallets. Solo resultados.</p>

        <div className="border border-black/10">
          <div className="grid grid-cols-5">
            {[
              { step: '01', title: 'Cargas créditos', sub: 'SPEI vía Bitso — pagas en MXN' },
              { step: '02', title: 'Backend convierte', sub: 'MXN → MXM en Arbitrum (asíncrono)' },
              { step: '03', title: 'Agente actúa', sub: 'Interpreta el intent, valida reglas' },
              { step: '04', title: 'Pago ejecutado', sub: 'x402 o Prontipagos según el canal' },
              { step: '05', title: 'Telegram confirma', sub: 'Notificación con desglose completo' },
            ].map(({ step, title, sub }, i) => (
              <div key={step} className="p-[14px] px-[14px] py-5 relative border-r border-black/10 last:border-r-0">
                <span className="font-mono text-[10px] text-ink-3 mb-[10px] block">{step}</span>
                <p className="text-[11.5px] font-medium text-ink leading-relaxed m-0 mb-1">{title}</p>
                <p className="text-[10.5px] text-ink-3 leading-relaxed m-0">{sub}</p>
                {i < 4 && (
                  <span className="absolute top-5 -right-[7px] w-[13px] h-[13px] bg-white border border-black/10 flex items-center justify-center z-10 text-[9px] text-ink-3">›</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHANNELS ──────────────────────────────────── */}
      <section className="max-w-[680px] mx-auto px-5 py-10 border-b border-black/10">
        <span className="font-mono text-[10px] tracking-[0.12em] text-ink-3 mb-5 block">canales de pago</span>
        <h2 className="font-display text-[22px] text-ink m-0 mb-6">Un SDK. Dos canales.</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              tag: 'canal x402', color: 'text-blue', bg: 'bg-blue-light',
              title: 'APIs en Arbitrum',
              desc: 'El agente recibe HTTP 402, paga MXM desde su Agentic Wallet y reintenta — todo en milisegundos. Sin intervención humana.',
              chips: ['OpenAI', 'CoinGecko', 'Perplexity', 'cualquier API x402'],
            },
            {
              tag: 'canal prontipagos', color: 'text-amber', bg: 'bg-amber-light',
              title: 'Servicios mexicanos',
              desc: 'El agente paga CFE, Telmex, Telcel y 400+ servicios vía Prontipagos API. Sin blockchain — solo créditos internos deducidos.',
              chips: ['CFE', 'Telmex', 'Telcel', 'Izzi', '400+ más'],
            },
          ].map(({ tag, color, bg, title, desc, chips }) => (
            <div key={tag} className="border border-black/10 p-[22px]">
              <span className={`font-mono text-[10px] tracking-[0.06em] px-2 py-[3px] ${bg} ${color} mb-3.5 inline-block`}>
                {tag}
              </span>
              <h3 className="font-display text-lg text-ink m-0 mb-2 leading-tight">{title}</h3>
              <p className="text-xs text-ink-3 leading-relaxed m-0 mb-4 font-[300]">{desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {chips.map(c => (
                  <span key={c} className="font-mono text-[10px] px-2 py-[3px] border border-black/10 text-ink-3">{c}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CREDITS (interactive) ─────────────────────── */}
      <section className="max-w-[680px] mx-auto px-5 py-10 border-b border-black/10">
        <span className="font-mono text-[10px] tracking-[0.12em] text-ink-3 mb-5 block">modelo de créditos</span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="font-display text-[22px] text-ink m-0 mb-2 leading-tight">Como minutos de celular,<br />pero para tu agente.</h2>
            <p className="text-xs text-ink-3 leading-relaxed font-[300] m-0 mb-3">
              Los créditos son la capa de abstracción entre el usuario y la blockchain. 1 crédito = $0.01 MXM. Se compran en MXN, se queman cuando el agente actúa, nunca se retiran.
            </p>
            <div className="flex flex-col gap-2 mt-4">
              {[
                { icon: '💳', t: 'Carga con SPEI / tarjeta', d: 'Bitso convierte MXN → MXM en Arbitrum de forma asíncrona.' },
                { icon: '⚡', t: 'El agente quema créditos', d: 'Cada API call o pago de servicio descuenta del saldo.' },
                { icon: '📱', t: 'Telegram te alerta', d: 'Saldo bajo → notificación. Recarga en un paso.' },
              ].map(({ icon, t, d }) => (
                <div key={t} className="flex gap-2.5">
                  <span className="text-sm mt-0.5">{icon}</span>
                  <div>
                    <p className="text-[11.5px] font-medium text-ink m-0 mb-0.5">{t}</p>
                    <p className="text-[10.5px] text-ink-3 leading-relaxed m-0 font-[300]">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive burner */}
          <div className="border border-black/10 p-[22px]">
            <div className="flex justify-between items-center mb-[18px]">
              <span className="font-mono text-[11px] text-ink-3">saldo de créditos</span>
              <span className={`font-mono text-[10px] px-2 py-0.5 border ${
                credits > 200 ? 'text-green border-green/20 bg-green-light' : 'text-amber border-amber/20 bg-amber-light'
              }`}>
                {credits > 200 ? 'activo' : 'saldo bajo'}
              </span>
            </div>

            <div className="text-center py-4">
              <p className={`text-6xl font-bold m-0 font-mono transition-colors duration-300 ${
                credits > 200 ? 'text-amber' : 'text-amber'
              }`}>
                {credits.toLocaleString()}
              </p>
              <p className="font-mono text-[11px] text-ink-3 m-0 mt-1">
                créditos · ${(credits * 0.01).toFixed(2)} MXM
              </p>
            </div>

            <div className="h-1 bg-black/[0.06] mb-[18px] overflow-hidden">
              <div className="h-full transition-all duration-400" style={{
                background: credits > 200 ? '#BA7517' : '#BA7517',
                width: `${(credits / 1000) * 100}%`,
              }} />
            </div>

            <button onClick={burn} disabled={credits <= 0 || burning}
              className={`w-full py-2.5 text-[11px] font-mono tracking-[0.02em] transition-colors ${
                burning
                  ? 'bg-amber-light text-amber border border-amber/20'
                  : credits <= 0
                    ? 'bg-black/[3%] text-ink-3 border border-black/10 cursor-not-allowed'
                    : 'bg-ink text-white border-none cursor-pointer hover:bg-ink-2'
              }`}
            >
              {burning ? 'ejecutando acción...' : credits <= 0 ? '— sin créditos —' : 'simular acción del agente'}
            </button>

            {credits <= 0 && (
              <div className="mt-2.5 p-2.5 text-center bg-amber-light border border-amber/20">
                <p className="font-mono text-[11px] text-amber m-0">
                  📱 Telegram: &ldquo;Tu agente necesita recarga&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── POLICY ENGINE ─────────────────────────────── */}
      <section className="max-w-[680px] mx-auto px-5 py-10 border-b border-black/10">
        <span className="font-mono text-[10px] tracking-[0.12em] text-ink-3 mb-5 block">policy engine</span>
        <h2 className="font-display text-[22px] text-ink m-0 mb-1">Tú pones las reglas.</h2>
        <p className="text-sm text-ink-3 font-[300] m-0 mb-6">El agente las respeta — o se detiene. Sin excepciones.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border border-black/10">
          {[
            { icon: '01 — límites', t: 'Tope de gasto', d: 'Monto máximo por tx y cap diario. El agente nunca los rompe.', c: 'daily_cap_mxn: 2000' },
            { icon: '02 — confirmación', t: 'Confirmación humana', d: 'Para montos altos, pide confirmación en Telegram antes de ejecutar.', c: 'confirm_above_mxn: 600' },
            { icon: '03 — schedule', t: 'Pagos programados', d: 'El agente paga la luz el día 5 de cada mes, automáticamente.', c: 'type: "monthly", day: 5' },
            { icon: '04 — alertas', t: 'Avisos previos', d: 'Alerta 2 días antes de un pago programado. Cancela si lo necesitas.', c: 'notify_before_days: 2' },
            { icon: '05 — halt', t: 'Reglas bloqueantes', d: 'Si viola una regla, el agente se detiene. Nunca ejecuta y pide disculpas después.', c: 'on_violation: "halt"' },
            { icon: '06 — audit', t: 'Historial completo', d: 'Cada acción en el dashboard con monto, fecha y estado. On-chain para x402.', c: 'persist_before_execute' },
          ].map(({ icon, t, d, c }, i) => (
            <div key={t} className={`px-[18px] py-[18px] border-r border-black/10 last:border-r-0 ${i < 3 ? '' : 'border-t border-black/10'}`}
              style={{ borderRight: (i + 1) % 3 === 0 ? 'none' : undefined }}
            >
              <span className="font-mono text-[10px] text-ink-3 mb-2 block tracking-[0.06em]">{icon}</span>
              <p className="text-xs font-medium text-ink m-0 mb-1.5">{t}</p>
              <p className="text-[11px] text-ink-3 leading-relaxed m-0 mb-2.5 font-[300]">{d}</p>
              <code className="font-mono text-[10px] text-amber bg-amber-light px-[7px] py-[3px] inline-block">{c}</code>
            </div>
          ))}
        </div>
      </section>

      {/* ── TELEGRAM BOT ──────────────────────────────── */}
      <section className="max-w-[680px] mx-auto px-5 py-10 border-b border-black/10">
        <span className="font-mono text-[10px] tracking-[0.12em] text-ink-3 mb-5 block">bot de telegram</span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="font-display text-[22px] text-ink m-0 mb-2.5 leading-tight">Interfaz conversacional.<br />Sin dashboard obligatorio.</h2>
            <p className="text-sm text-ink-3 leading-relaxed font-[300] m-0 mb-5">
              El bot es la cara del agente. Usa GPT-4o para entender intención y visión para OCR de recibos. Tú mandas una foto — el agente paga.
            </p>
            <div className="flex flex-col gap-3">
              {[
                { t: 'OCR de recibos', d: 'foto de CFE → extrae referencia y monto' },
                { t: 'Crear agente', d: '"crea un agente" → wallet lista en Arbitrum' },
                { t: 'Reglas de voz', d: '"regla para CFE de $500" → configurado' },
                { t: 'Pagos directos', d: '"paga Telmex ref 99012" → ejecutado' },
                { t: 'Consultas', d: 'saldo, historial, detalle de agentes' },
              ].map(({ t, d }) => (
                <div key={t} className="flex items-start gap-2.5">
                  <span className="w-1 h-1 rounded-full bg-ink-3 flex-shrink-0 mt-[7px]" />
                  <p className="text-xs text-ink-3 leading-relaxed font-[300] m-0">
                    <strong className="font-medium text-ink">{t}</strong> — {d}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Mock chat */}
          <div className="border border-black/10 p-4 flex flex-col gap-2.5">
            <div className="max-w-[80%] self-end px-3 py-[9px] text-[11.5px] leading-relaxed font-[300]" style={{ background: '#f0f0f0', color: '#0d0d0d' }}>
              paga mi CFE este mes, ref 123456, son $312 pesos
            </div>
            <div className="max-w-[80%] self-start px-3 py-[9px] text-[11px] leading-relaxed font-mono bg-white border border-black/10 text-ink">
              <span className="text-green">✓</span> validando reglas...<br />
              <span className="text-green">✓</span> ref <span className="text-amber">123456</span> encontrada<br />
              <span className="text-green">✓</span> monto <span className="text-blue">$312.00 MXN</span><br />
              ¿confirmo el pago?
            </div>
            <div className="max-w-[80%] self-end px-3 py-[9px] text-[11.5px] leading-relaxed font-[300]" style={{ background: '#f0f0f0', color: '#0d0d0d' }}>
              sí
            </div>
            <div className="max-w-[80%] self-start px-3 py-[9px] text-[11px] leading-relaxed font-mono bg-white border border-black/10 text-ink">
              <span className="text-green">✓ pago ejecutado</span><br />
              canal: prontipagos (CFE)<br />
              créditos usados: <span className="text-blue">31,200</span><br />
              tx: <span className="text-amber">open402_0x7f...</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── STACK ─────────────────────────────────────── */}
      <section className="max-w-[680px] mx-auto px-5 py-10 border-b border-black/10">
        <span className="font-mono text-[10px] tracking-[0.12em] text-ink-3 mb-5 block">construido sobre</span>
        <div className="flex flex-wrap border border-black/10">
          {[
            { name: 'Arbitrum One', role: 'red principal' },
            { name: 'Coinbase CDP', role: 'wallets MPC' },
            { name: 'x402 Protocol', role: 'pago de APIs' },
            { name: 'Prontipagos', role: 'servicios MX' },
            { name: 'Bitso FXaaS', role: 'on-ramp fiat' },
            { name: 'Next.js 14', role: 'dashboard' },
            { name: 'Prisma + PG', role: 'base de datos' },
            { name: 'Linux Foundation', role: 'x402 estándar' },
          ].map(({ name, role }, i) => (
            <div key={name} className="px-[18px] py-3 border-r border-black/10 border-b border-black/10 flex-none">
              <div className="font-mono text-[11px] font-medium text-ink">{name}</div>
              <div className="text-[10px] text-ink-3 mt-[1px]">{role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────── */}
      <section className="max-w-[680px] mx-auto px-5 py-[52px] pb-10 text-center">
        <h2 className="font-display text-[32px] leading-[1.1] text-ink m-0 mb-3">
          La economía de agentes<br /><em className="italic text-amber not-italic">ya está aquí.</em>
        </h2>
        <p className="text-sm text-ink-3 leading-relaxed max-w-[440px] mx-auto m-0 mb-7 font-[300]">
          x402 fue formalizado por Linux Foundation en abril 2026. Visa, Mastercard, Google, AWS y Stripe son miembros fundadores. El mercado no existía porque la infraestructura no existía. La estamos construyendo.
        </p>
        <div className="flex gap-2.5 justify-center flex-wrap mb-4">
          <SignedOut>
            <SignInButton>
              <button className="font-mono text-[11px] px-5 py-2.5 bg-ink text-white cursor-pointer hover:bg-ink-2 transition-colors border-none tracking-[0.02em]">
                npm install @open402/agents →
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <a href="/dashboard" className="font-mono text-[11px] px-5 py-2.5 bg-ink text-white no-underline hover:bg-ink-2 transition-colors tracking-[0.02em]">
              Ir al Dashboard →
            </a>
          </SignedIn>
          <a href="#sdk" className="font-mono text-[11px] px-5 py-2.5 bg-transparent text-ink border border-black/10 no-underline cursor-pointer hover:border-ink transition-colors">
            ver documentación
          </a>
          <a href="https://github.com" className="font-mono text-[11px] px-5 py-2.5 bg-transparent text-ink border border-black/10 no-underline cursor-pointer hover:border-ink transition-colors">
            ★ github
          </a>
        </div>
        <p className="font-mono text-[10px] text-ink-3 tracking-[0.04em]">
          sin wallets · sin llaves privadas · sin fricción
        </p>
      </section>

    </div>
  );
}
