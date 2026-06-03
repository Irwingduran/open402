'use client';

import { Navbar } from '../components/navbar';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import { useEffect, useRef, useState } from 'react';

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
  { icon: '⚡', label: 'Pago CFE ejecutado', amount: '$312.50 MXN', time: '09:05', color: '#f59e0b' },
  { icon: '🔗', label: 'x402 → CoinGecko API', amount: '$0.003 USDC', time: '09:06', color: '#3b82f6' },
  { icon: '🔗', label: 'x402 → OpenAI API', amount: '$0.012 USDC', time: '09:08', color: '#3b82f6' },
  { icon: '⚡', label: 'Pago Telmex ejecutado', amount: '$199.00 MXN', time: '09:15', color: '#f59e0b' },
  { icon: '🔗', label: 'x402 → Perplexity API', amount: '$0.007 USDC', time: '09:17', color: '#3b82f6' },
  { icon: '🔔', label: 'Saldo bajo — recarga', amount: '200 créditos', time: '09:20', color: '#ef4444' },
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
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all duration-300 ${
            visible.includes(i) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2.5'
          }`}
          style={{
            background: 'rgba(0,0,0,0.03)',
            borderColor: 'rgba(0,0,0,0.06)',
          }}
        >
          <span className="text-sm">{item.icon}</span>
          <span className="flex-1 text-[11px] font-mono text-slate-600">{item.label}</span>
          <span className="text-[11px] font-mono font-bold" style={{ color: item.color }}>{item.amount}</span>
          <span className="text-[10px] font-mono text-slate-400">{item.time}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Flow step ────────────────────────────────────────────────────────────────
function FlowStep({ step, title, sub, color, delay }: { step: string; title: string; sub: string; color: string; delay: number }) {
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
      <div
        className="w-[38px] h-[38px] rounded-lg flex items-center justify-center text-xs font-bold font-mono border"
        style={{ background: color + '14', borderColor: color + '30', color }}
      >
        {step}
      </div>
      <div className="text-center">
        <p className="text-xs font-bold text-slate-700 m-0 mb-0.5">{title}</p>
        <p className="text-[11px] text-slate-400 m-0 leading-relaxed">{sub}</p>
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
    <div className="bg-white text-slate-800 font-serif overflow-x-hidden">

      <Navbar />

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="px-8 py-20">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* left */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border mb-6" style={{
              background: 'rgba(245,158,11,0.08)',
              borderColor: 'rgba(245,158,11,0.2)',
            }}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              <span className="text-[11px] font-mono tracking-wider text-amber-700">
                protocolo x402 · Arbitrum · LATAM-first
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl leading-[1.03] font-black m-0 mb-[18px] tracking-tight italic">
              Tu agente paga.{' '}
              <span className="text-amber-500">Tú controlas.</span>
            </h1>

            <p className="text-[15px] leading-relaxed text-slate-500 m-0 mb-7 max-w-[420px] font-sans not-italic">
              Infraestructura financiera para la economía de agentes. Una línea de código y tu agente paga APIs vía x402, servicios mexicanos (CFE, Telmex, Telcel) y lo que se le ocurra — sin wallets, sin llaves privadas, sin fricción.
            </p>

            <div className="flex gap-2.5">
              <SignedOut>
                <SignInButton>
                  <button className="text-xs font-mono font-bold px-[22px] py-3 rounded-lg bg-amber-500 text-black border-none cursor-pointer hover:bg-amber-400 transition-colors">
                    Crear mi agente →
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <a href="/dashboard" className="text-xs font-mono font-bold px-[22px] py-3 rounded-lg bg-amber-500 text-black no-underline hover:bg-amber-400 transition-colors">
                  Ir al Dashboard →
                </a>
              </SignedIn>
              <a href="#sdk" className="text-xs font-mono px-[22px] py-3 rounded-lg bg-transparent text-slate-700 border border-black/15 no-underline hover:bg-black/5 transition-colors">
                Ver SDK
              </a>
            </div>

            <div className="flex gap-7 mt-9">
              {[
                { n: 400, s: '+', l: 'servicios MX' },
                { n: 1, s: '.5%', l: 'fee por tx' },
                { n: 0, s: ' wallets', l: 'para el usuario' },
              ].map(({ n, s, l }) => (
                <div key={l}>
                  <p className="text-[22px] font-extrabold m-0 font-mono text-slate-900">
                    <Counter to={n} />{s}
                  </p>
                  <p className="text-[11px] text-slate-400 m-0 mt-0.5 font-sans">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* right: terminal */}
          <div className="rounded-xl border overflow-hidden" style={{
            background: '#f8fafc',
            borderColor: 'rgba(0,0,0,0.08)',
          }}>
            <div className="flex items-center justify-between px-3.5 py-2 border-b" style={{
              background: 'rgba(0,0,0,0.02)',
              borderColor: 'rgba(0,0,0,0.06)',
            }}>
              <div className="flex gap-1.5">
                {['#ef4444', '#f59e0b', '#22c55e'].map(c => (
                  <span key={c} className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: c }} />
                ))}
              </div>
              <span className="text-[11px] font-mono text-slate-400">agente · activo</span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            </div>
            <div className="p-3.5">
              <p className="text-[11px] font-mono text-slate-300 m-0 mb-2">// actividad del agente en tiempo real</p>
              <AgentFeed />
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section id="how" className="bg-slate-50 border-y border-black/5 px-8 py-[72px]">
        <div className="max-w-[1080px] mx-auto">
          <div className="text-center mb-[52px]">
            <p className="text-[10px] text-amber-500 font-mono tracking-widest m-0 mb-2.5">EL FLUJO</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold m-0 tracking-tight italic text-slate-900">
              De pesos a pagos en segundos
            </h2>
          </div>

          <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="absolute top-[19px] left-[8%] right-[8%] h-px" style={{ background: 'rgba(245,158,11,0.2)' }} />
            <FlowStep step="01" title="Cargas créditos" sub="Tarjeta MXN via Conekta o SPEI" color="#f59e0b" delay={0} />
            <FlowStep step="02" title="Backend convierte" sub="MXN → USDC en Arbitrum via Bitso" color="#3b82f6" delay={120} />
            <FlowStep step="03" title="Agente actúa" sub="Claude interpreta el intent" color="#8b5cf6" delay={240} />
            <FlowStep step="04" title="Pago ejecutado" sub="x402 API o Prontipagos (CFE, Telmex...)" color="#22c55e" delay={360} />
            <FlowStep step="05" title="Telegram confirma" sub="Notificación con desglose" color="#f59e0b" delay={480} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-12">
            {[
              {
                tag: 'Canal x402', color: '#3b82f6',
                title: 'APIs en Arbitrum',
                desc: 'El agente recibe HTTP 402, paga USDC desde su Agentic Wallet y reintenta — todo en milisegundos. Sin intervención humana.',
                chips: ['OpenAI', 'CoinGecko', 'Perplexity', 'cualquier API x402'],
              },
              {
                tag: 'Canal Prontipagos', color: '#f59e0b',
                title: 'Servicios mexicanos',
                desc: 'El agente paga CFE, Telmex, Telcel y 400+ servicios via Prontipagos API. Sin blockchain — solo créditos internos.',
                chips: ['CFE', 'Telmex', 'Telcel', 'Izzi'],
              },
            ].map(({ tag, color, title, desc, chips }) => (
              <div key={tag} className="p-5.5 rounded-xl bg-white border" style={{ borderColor: color + '22' }}>
                <span className="inline-block mb-2.5 px-[9px] py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider" style={{ background: color + '10', color }}>
                  {tag}
                </span>
                <h3 className="text-lg font-bold m-0 mb-1.5 italic text-slate-800">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed m-0 mb-3.5 font-sans">{desc}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {chips.map(c => (
                    <span key={c} className="text-[10px] font-mono px-[7px] py-0.5 rounded border text-slate-500" style={{
                      background: 'rgba(0,0,0,0.03)',
                      borderColor: 'rgba(0,0,0,0.06)',
                    }}>{c}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SDK ───────────────────────────────────────── */}
      <section id="sdk" className="px-8 py-[72px]">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
          {/* code */}
          <div className="rounded-xl overflow-hidden border border-white/10" style={{ background: '#0d1117' }}>
            <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-[11px] font-mono text-slate-700">agent.ts</span>
              <span className="text-[10px] font-mono px-[7px] py-0.5 rounded text-green-500" style={{ background: 'rgba(34,197,94,0.08)' }}>
                npm install @open402/agents
              </span>
            </div>
            <pre className="p-[18px] m-0 text-[11.5px] leading-relaxed font-mono text-slate-300 overflow-x-auto">{`import { AgentX } from '@open402/agents';

const agentx = await AgentX.create({
  apiKey: process.env.OPEN402_KEY,
});

const agent = await agentx.createAgent('Mi Agente', {
  policy: {
    daily_cap_mxn: 2000,
    confirm_above_mxn: 800,
    services: ['cfe', 'telmex'],
  },
});

// Pagar una API vía x402 (Arbitrum)
await agent.payX402({
  url: 'https://api.coingecko.com/v3/price',
});

// Pagar un servicio mexicano
await agent.payService({
  provider: 'cfe',
  reference: '123456789',
});`}</pre>
          </div>

          {/* narrative */}
          <div>
            <p className="text-[10px] text-amber-500 font-mono tracking-widest m-0 mb-3">SDK</p>
            <h2 className="text-3xl sm:text-[34px] font-extrabold m-0 mb-[18px] tracking-tight italic leading-[1.1] text-slate-900">
              Una integración.<br />Dos canales.<br />Cero complejidad.
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed m-0 mb-[26px] font-sans">
              El SDK abstrae wallets MPC, claves privadas, transacciones on-chain y protocolos de pago. Tu agente paga sin que toques una sola llave privada.
            </p>

            {[
              { icon: '🔐', t: 'Agentic Wallets con TEE', d: 'Claves en AWS Nitro Enclaves. Nunca expuestas al LLM ni al developer.' },
              { icon: '📏', t: 'Policy engine granular', d: 'Límite diario, máximo por tx, confirmación obligatoria. Las reglas son bloqueantes.' },
              { icon: '🧾', t: 'Audit trail on-chain', d: 'Cada transacción x402 queda registrada en Arbitrum. Auditable para siempre.' },
              { icon: '⚡', t: 'Prontipagos + x402', d: '400+ servicios MX y cualquier API con soporte x402. Un solo SDK.' },
            ].map(({ icon, t, d }) => (
              <div key={t} className="flex gap-3 mb-[18px]">
                <span className="text-lg mt-0.5">{icon}</span>
                <div>
                  <p className="text-xs font-bold m-0 mb-0.5 text-slate-700 font-sans">{t}</p>
                  <p className="text-[11px] text-slate-400 m-0 leading-relaxed font-sans">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CREDITS (interactive) ─────────────────────── */}
      <section className="bg-slate-50 border-y border-black/5 px-8 py-[72px]">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14">
          <div>
            <p className="text-[10px] text-amber-500 font-mono tracking-widest m-0 mb-3">MODELO DE CRÉDITOS</p>
            <h2 className="text-3xl sm:text-[34px] font-extrabold m-0 mb-[18px] italic tracking-tight leading-[1.1] text-slate-900">
              Como minutos de celular,<br />pero para tu agente.
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed m-0 mb-4 font-sans">
              Los créditos son la capa de abstracción entre el usuario y la blockchain. 1 crédito = $0.01 USD. Se compran en MXN con tarjeta, se queman cuando el agente actúa, nunca se retiran.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              El backend convierte MXN → USDC en Arbitrum via Bitso de forma asíncrona. El usuario no ve crypto — solo créditos, acciones y resultados.
            </p>
          </div>

          {/* Interactive burner */}
          <div className="rounded-xl border p-6 bg-white" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            <div className="flex justify-between items-center mb-[18px]">
              <span className="text-[11px] font-mono text-slate-400">saldo de créditos</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                credits > 200
                  ? 'text-green-600 bg-green-50'
                  : 'text-red-500 bg-red-50'
              }`}>
                {credits > 200 ? 'activo' : '⚠ saldo bajo'}
              </span>
            </div>

            <div className="text-center py-4">
              <p className={`text-6xl font-extrabold m-0 font-mono transition-colors duration-300 ${
                credits > 200 ? 'text-amber-500' : 'text-red-500'
              }`}>
                {credits.toLocaleString()}
              </p>
              <p className="text-[11px] font-mono text-slate-400 m-0 mt-1">
                créditos · ${(credits * 0.01).toFixed(2)} USD
              </p>
            </div>

            <div className="h-1 rounded bg-black/5 mb-[18px] overflow-hidden">
              <div className="h-full rounded transition-all duration-400" style={{
                background: credits > 200 ? '#f59e0b' : '#ef4444',
                width: `${(credits / 1000) * 100}%`,
              }} />
            </div>

            <button onClick={burn} disabled={credits <= 0 || burning}
              className={`w-full py-2.5 rounded-lg text-xs font-mono font-bold border transition-all duration-200 ${
                burning
                  ? 'bg-amber-50 text-amber-600 border-amber-300'
                  : credits <= 0
                    ? 'bg-black/[3%] text-slate-400 border-black/10 cursor-not-allowed'
                    : 'bg-amber-500 text-black border-none cursor-pointer hover:bg-amber-400'
              }`}
            >
              {burning ? '⚡ ejecutando acción...' : credits <= 0 ? '— sin créditos —' : '⚡ simular acción del agente'}
            </button>

            {credits <= 0 && (
              <div className="mt-2.5 p-2.5 rounded-lg text-center bg-red-50 border border-red-200">
                <p className="text-[11px] font-mono text-red-500 m-0">
                  📱 Telegram: &ldquo;Tu agente necesita recarga&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── POLICY ENGINE ─────────────────────────────── */}
      <section className="px-8 py-[72px]">
        <div className="max-w-[1080px] mx-auto">
          <div className="text-center mb-11">
            <p className="text-[10px] text-amber-500 font-mono tracking-widest m-0 mb-2.5">POLICY ENGINE</p>
            <h2 className="text-3xl sm:text-[34px] font-extrabold m-0 italic tracking-tight text-slate-900">
              Tú pones las reglas. El agente las respeta.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[
              { icon: '📅', t: 'Pagos programados', d: 'El agente paga la luz el día 5 de cada mes, a las 9am, automáticamente.', c: 'schedule: { type: "monthly", day: 5 }' },
              { icon: '🔒', t: 'Límites de gasto', d: 'Define monto máximo por transacción y cap diario. El agente nunca los rompe.', c: 'max_amount_mxn: 800, daily_cap: 2000' },
              { icon: '✋', t: 'Confirmación obligatoria', d: 'Para montos altos, pide confirmación en Telegram antes de ejecutar.', c: 'confirm_above_mxn: 600' },
              { icon: '🔔', t: 'Alertas inteligentes', d: 'Recibe alerta 2 días antes de un pago programado. Cancela si lo necesitas.', c: 'notify_before_days: 2' },
              { icon: '🧾', t: 'Historial completo', d: 'Cada acción queda en el dashboard con monto, fecha y estado.', c: 'persist_before_execute: true' },
              { icon: '🛑', t: 'Reglas bloqueantes', d: 'Si viola una regla, el agente se detiene — nunca ejecuta y se disculpa después.', c: 'on_violation: "halt_and_notify"' },
            ].map(({ icon, t, d, c }) => (
              <div key={t}
                className="p-[18px] rounded-xl bg-white border transition-colors duration-200 cursor-default"
                style={{ borderColor: 'rgba(0,0,0,0.06)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.28)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)')}
              >
                <span className="text-xl block mb-2">{icon}</span>
                <p className="text-xs font-bold m-0 mb-1.5 text-slate-700 font-sans">{t}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed m-0 mb-2.5 font-sans">{d}</p>
                <code className="text-[10px] font-mono block leading-relaxed px-[7px] py-0.5 rounded text-amber-600" style={{ background: 'rgba(245,158,11,0.06)' }}>
                  {c}
                </code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────── */}
      <div className="border-t border-black/5 px-8 py-6 text-center bg-slate-50">
        <p className="text-[10px] text-slate-400 font-mono tracking-widest mb-3.5">CONSTRUIDO SOBRE</p>
        <div className="flex items-center justify-center gap-7 flex-wrap">
          {['Arbitrum One', 'Coinbase CDP', 'x402 Protocol', 'Prontipagos', 'Conekta', 'Bitso FXaaS', 'Linux Foundation'].map(t => (
            <span key={t} className="text-[11px] font-mono font-semibold text-slate-500">{t}</span>
          ))}
        </div>
      </div>

      {/* ── FINAL CTA ────────────────────────────────── */}
      <section className="py-[90px] px-8 border-t border-black/5 text-center">
        <h2 className="text-4xl sm:text-[46px] font-black m-0 mb-3.5 italic tracking-tight leading-[1.05] text-slate-900">
          La economía de agentes<br />
          <span className="text-amber-500">ya está aquí.</span>
        </h2>
        <p className="text-sm text-slate-500 m-0 mb-8 font-sans leading-relaxed">
          x402 fue formalizado por Linux Foundation en abril 2026. Visa, Mastercard, Google, AWS y Stripe son miembros fundadores.<br />
          El mercado no existía porque la infraestructura no existía. La estamos construyendo.
        </p>
        <SignedOut>
          <SignInButton>
            <button className="text-sm font-mono font-bold px-[30px] py-[13px] rounded-lg bg-amber-500 text-black border-none cursor-pointer hover:bg-amber-400 transition-colors">
              Crear mi agente →
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <a href="/dashboard" className="inline-block text-sm font-mono font-bold px-[30px] py-[13px] rounded-lg bg-amber-500 text-black no-underline hover:bg-amber-400 transition-colors">
            Ir al Dashboard →
          </a>
        </SignedIn>
        <p className="mt-3 text-[11px] font-mono text-slate-400">
          Sin wallets. Sin llaves privadas. Sin fricción.
        </p>
      </section>

    </div>
  );
}
