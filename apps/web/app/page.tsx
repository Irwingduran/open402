'use client';

import { Navbar } from '../components/navbar';
import { SignedIn, SignedOut, SignInButton } from '../components/auth';
import { useEffect, useState } from 'react';

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
      'bg-amber-l text-amber border-amber/20'
    }`}>
      {status === 'linking' && 'Vinculando cuenta de Telegram...'}
      {status === 'success' && 'Cuenta de Telegram vinculada correctamente'}
      {status === 'error' && 'Error al vincular cuenta de Telegram'}
      {status === 'noauth' && 'Inicia sesión primero para vincular tu cuenta de Telegram'}
    </div>
  );
}

// ─── §6 Lo que funciona hoy ────────────────────────────────────────────────────
// La tabla no se publica con estados vacíos. Para activarla, llena `estado` con
// "En producción", "En pruebas" o "Prototipo" en las filas que correspondan.
// TODO(irwing): estado del Motor de políticas
// TODO(irwing): estado del Pago de servicios vía Prontipagos
// TODO(irwing): estado del Bot de Telegram con lectura de recibos
// TODO(irwing): estado del Pago de APIs vía x402
// TODO(irwing): estado de la Carga de saldo por SPEI
// TODO(irwing): estado del Registro de auditoría
const PIEZAS: { pieza: string; estado: string | null }[] = [
  { pieza: 'Motor de políticas', estado: null },
  { pieza: 'Pago de servicios vía Prontipagos', estado: null },
  { pieza: 'Bot de Telegram con lectura de recibos', estado: null },
  { pieza: 'Pago de APIs vía x402', estado: null },
  { pieza: 'Carga de saldo por SPEI', estado: null },
  { pieza: 'Registro de auditoría', estado: null },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const piezasConEstado = PIEZAS.filter((p) => p.estado);

  return (
    <div className="bg-white text-ink font-sans text-sm">

      <TelegramLinkHandler />

      {/* ── 0 · NAV ───────────────────────────────── */}
      <div className="max-w-[680px] mx-auto px-5">
        <Navbar variant="landing" />
      </div>

      {/* ── 1 · HERO ───────────────────────────────── */}
      <section className="max-w-[680px] mx-auto px-5 py-14 pb-12 border-b border-black/[0.09]">

        <h1 className="font-display text-[46px] leading-[1.04] tracking-tight text-ink m-0 mb-[18px]">
          Dile a tu agente<br />qué pagar.<br /><em className="italic text-amber not-italic">Tú pones los límites.</em>
        </h1>

        <p className="text-[15px] leading-relaxed text-ink-3 max-w-[500px] m-0 mb-[30px] font-[300]">
          open402 permite que un agente de IA pague servicios reales en México, como luz, teléfono e internet, dentro de reglas que tú defines. <strong className="font-medium text-ink">Sin wallets visibles ni llaves privadas.</strong>
        </p>

        <div className="flex gap-2.5 flex-wrap mb-4">
          <a href="#demo" className="font-mono text-[11px] px-[22px] py-[11px] bg-ink text-white no-underline cursor-pointer hover:bg-ink-2 transition-colors tracking-[0.02em]">
            Ver la demo →
          </a>
          <SignedOut>
            <SignInButton>
              <button className="font-mono text-[11px] px-[22px] py-[11px] bg-transparent text-ink border border-black/[0.09] cursor-pointer hover:border-black/30 transition-colors">
                npm install @open402/agents
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <a href="/dashboard" className="font-mono text-[11px] px-[22px] py-[11px] bg-transparent text-ink border border-black/[0.09] no-underline hover:border-black/30 transition-colors">
              npm install @open402/agents
            </a>
          </SignedIn>
          <a href="https://github.com/Irwingduran/open402.git" className="font-mono text-[11px] px-[22px] py-[11px] bg-transparent text-ink border border-black/[0.09] no-underline cursor-pointer hover:border-black/30 transition-colors">
            ★ Ver en GitHub
          </a>
        </div>

        {/* TODO(irwing): confirmar la cifra de servicios disponibles hoy y reponer
            el segmento "Más de 400 servicios mexicanos" en esta línea */}
        <p className="font-mono text-[10.5px] text-ink-4 tracking-[0.04em] m-0">
          SDK de código abierto · Reglas definidas por el usuario
        </p>
      </section>

      {/* ── 2 · DEMO ───────────────────────────────── */}
      <section id="demo" className="max-w-[680px] mx-auto px-5 py-9 border-b border-black/[0.09]">
        <span className="font-mono text-[10px] tracking-[0.1em] text-ink-4 block mb-[10px]">demo</span>
        <h2 className="font-display text-2xl text-ink leading-tight m-0 mb-1.5">Un mensaje. Un recibo pagado.</h2>
        <p className="text-sm text-ink-3 font-[300] max-w-[520px] leading-relaxed m-0 mb-6">
          Escribes &ldquo;paga mi recibo de luz&rdquo;. El agente consulta el monto, revisa tus reglas y paga. Si el monto supera tu límite, te pide confirmación antes. Al terminar recibes el comprobante.
        </p>

        <div className="max-w-[480px]">
          {/* TODO(irwing): pie del video o captura — "Pago real realizado el DD/MM/AAAA"
              o "Demostración en entorno de pruebas"; mientras, solo la conversación */}
          <div className="font-mono text-[9px] text-ink-4 tracking-[0.06em] mb-1.5">Demostración</div>
          <div className="border border-black/[0.09] p-[14px] flex flex-col gap-[9px]">
            <div className="max-w-[82%] self-end px-3 py-2 text-[11px] leading-relaxed font-[300] text-ink" style={{ background: '#f0efed' }}>
              paga mi CFE este mes, ref 123456, son $312
            </div>
            <div className="max-w-[82%] self-start px-3 py-2 text-[10.5px] leading-relaxed font-mono bg-white border border-black/[0.09] text-ink">
              <span className="text-green">✓</span> ref <span className="text-amber">123456</span> verificada<br />
              <span className="text-green">✓</span> monto: <span className="text-blue">$312.00 MXN</span><br />
              <span className="text-green">✓</span> reglas: ok (límite $500)<br />
              ¿confirmo el pago?
            </div>
            <div className="max-w-[82%] self-end px-3 py-2 text-[11px] leading-relaxed font-[300] text-ink" style={{ background: '#f0efed' }}>
              sí
            </div>
            <div className="max-w-[82%] self-start px-3 py-2 text-[10.5px] leading-relaxed font-mono bg-white border border-black/[0.09] text-ink">
              <span className="text-green">✓ ejecutado · prontipagos</span><br />
              créditos usados: <span className="text-blue">31,200</span><br />
              comprobante: <span className="text-amber">open402_0x7f2a...</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 · EL PROBLEMA ────────────────────────── */}
      <section className="max-w-[680px] mx-auto px-5 py-9 border-b border-black/[0.09]">
        <span className="font-mono text-[10px] tracking-[0.1em] text-ink-4 block mb-[10px]">el problema</span>
        <h2 className="font-display text-2xl text-ink leading-tight m-0 mb-1.5">Los agentes ya deciden. Todavía no pueden pagar con seguridad.</h2>
        <p className="text-sm text-ink-3 font-[300] max-w-[540px] leading-relaxed m-0 mb-3">
          Darle a un agente acceso a tu dinero hoy es todo o nada: o no puede pagar, o puede gastarlo todo. Y en México pagar un servicio sigue siendo abrir una app distinta por cada recibo, o ir a la tienda con efectivo.
        </p>
        <p className="text-sm text-ink-3 font-[300] max-w-[540px] leading-relaxed m-0">
          Automatizarlo con domiciliación tampoco ha funcionado: la gente no quiere perder el control de cuándo y cuánto se cobra.
        </p>
      </section>

      {/* ── 4 · REGLAS DEL USUARIO ─────────────────── */}
      <section className="max-w-[680px] mx-auto px-5 py-9 border-b border-black/[0.09]">
        <span className="font-mono text-[10px] tracking-[0.1em] text-ink-4 block mb-[10px]">la pieza central</span>
        <h2 className="font-display text-2xl text-ink leading-tight m-0 mb-1.5">El agente paga. Las reglas son tuyas.</h2>
        <p className="text-sm text-ink-3 font-[300] max-w-[520px] leading-relaxed m-0 mb-6">
          Antes de cada pago, open402 revisa la política que definió el usuario. Si el pago cabe en las reglas, se ejecuta. Si no, se detiene o pide confirmación.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 border border-black/[0.09]">
          {[
            { icon: '01 · tope diario', t: 'Tope diario', d: 'El agente no puede gastar más de lo que fijes por día.', c: 'daily_cap_mxn: 2000' },
            { icon: '02 · confirmación', t: 'Confirmación sobre un monto', d: 'Arriba de cierta cantidad, siempre te pregunta.', c: 'confirm_above_mxn: 600' },
            { icon: '03 · servicios', t: 'Servicios permitidos', d: 'Solo paga lo que autorizaste: luz, teléfono, internet.', c: 'services: ["cfe", "telmex"]' },
            { icon: '04 · schedule', t: 'Pagos programados', d: 'Un pago mensual en el día que elijas.', c: 'type: "monthly", day: 5' },
            { icon: '05 · aviso', t: 'Aviso previo', d: 'Te notifica antes de que venza un recibo.', c: 'notify_before_days: 2' },
            { icon: '06 · halt', t: 'Alto inmediato', d: 'Ante una violación de reglas, el agente se detiene.', c: 'on_violation: "halt"' },
          ].map(({ icon, t, d, c }, i) => (
            <div key={t}
              className={`px-4 py-4 border-r border-black/[0.09] last:border-r-0 ${i >= 3 ? 'border-t border-black/[0.09]' : ''}`}
              style={{ borderRight: (i + 1) % 3 === 0 ? 'none' : undefined }}
            >
              <span className="font-mono text-[9.5px] tracking-[0.06em] text-ink-4 block mb-[7px]">{icon}</span>
              <div className="text-xs font-medium text-ink mb-1">{t}</div>
              <p className="text-[11px] text-ink-3 leading-relaxed font-[300] m-0 mb-2">{d}</p>
              <code className="font-mono text-[10px] text-amber bg-amber-l px-[7px] py-[2px] inline-block">{c}</code>
            </div>
          ))}
        </div>

        <p className="font-mono text-[10.5px] text-ink-4 tracking-[0.04em] m-0 mt-4">
          Cada decisión queda registrada antes de ejecutarse.
        </p>
      </section>

      {/* ── 5 · PARA DESARROLLADORES ───────────────── */}
      <section id="sdk" className="max-w-[680px] mx-auto px-5 py-9 border-b border-black/[0.09]">
        <span className="font-mono text-[10px] tracking-[0.1em] text-ink-4 block mb-[10px]">para desarrolladores</span>
        <h2 className="font-display text-2xl text-ink leading-tight m-0 mb-1.5">De cero a un agente que paga, en minutos.</h2>
        <p className="text-sm text-ink-3 font-[300] max-w-[520px] leading-relaxed m-0 mb-6">
          Una integración. Defines la política, llamas al pago y el SDK se encarga del resto.
        </p>

        <div className="border border-black/[0.09] overflow-hidden">
          <div className="flex items-center justify-between px-[14px] py-[9px] border-b border-black/[0.09] bg-[#f7f6f3]">
            <span className="font-mono text-[11px] text-ink-3">agent.ts</span>
            <span className="font-mono text-[10px] px-2 py-[2px] bg-green-l text-green">npm install @open402/agents</span>
          </div>
          {/* TODO(irwing): confirmar que el ejemplo coincide con la API actual del SDK */}
          <pre className="m-0 px-5 py-[18px] text-[11.5px] leading-relaxed font-mono text-ink overflow-x-auto bg-[#f7f6f3]">
{`const agent = await AgentX.create({
  apiKey: process.env.OPEN402_KEY,
  policy: {
    daily_cap_mxn: 2000,
    confirm_above_mxn: 800,
    services: ["cfe", "telmex"],
  },
})

await agent.payService({ provider: "cfe", reference: "..." })`}
          </pre>
        </div>

        <p className="text-xs text-ink-3 font-[300] leading-relaxed m-0 mt-3">
          El mismo agente puede pagar APIs que cobran por uso mediante el protocolo x402.
        </p>
      </section>

      {/* ── 6 · LO QUE FUNCIONA HOY ────────────────── */}
      {piezasConEstado.length > 0 && (
        <section className="max-w-[680px] mx-auto px-5 py-9 border-b border-black/[0.09]">
          <span className="font-mono text-[10px] tracking-[0.1em] text-ink-4 block mb-[10px]">lo que funciona hoy</span>
          <h2 className="font-display text-2xl text-ink leading-tight m-0 mb-1.5">Qué está construido y qué no.</h2>
          <p className="text-sm text-ink-3 font-[300] max-w-[520px] leading-relaxed m-0 mb-6">
            Preferimos mostrar el estado real de cada pieza.
          </p>

          <div className="border border-black/[0.09]">
            <div className="grid grid-cols-[1fr_140px] border-b border-black/[0.09]">
              <span className="font-mono text-[10px] tracking-[0.06em] text-ink-4 px-3 py-2.5 border-r border-black/[0.09]">Pieza</span>
              <span className="font-mono text-[10px] tracking-[0.06em] text-ink-4 px-3 py-2.5">Estado</span>
            </div>
            {piezasConEstado.map(({ pieza, estado }) => (
              <div key={pieza} className="grid grid-cols-[1fr_140px] border-b border-black/[0.09] last:border-b-0">
                <div className="text-xs font-medium text-ink px-3 py-2.5 border-r border-black/[0.09] leading-relaxed">{pieza}</div>
                <div className="text-[11.5px] text-ink-3 px-3 py-2.5 leading-relaxed font-[300]">{estado}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 7 · LA APUESTA ─────────────────────────── */}
      <section className="max-w-[680px] mx-auto px-5 py-9 border-b border-black/[0.09]">
        <span className="font-mono text-[10px] tracking-[0.1em] text-ink-4 block mb-[10px]">la apuesta</span>
        <h2 className="font-display text-2xl text-ink leading-tight m-0 mb-1.5">Pagar un recibo por chat se puede copiar. Esto no tanto.</h2>
        <p className="text-sm text-ink-3 font-[300] max-w-[540px] leading-relaxed m-0">
          La interfaz conversacional y la conexión a un agregador de servicios son replicables. Lo sabemos. Lo que queremos construir es lo que se acumula con el uso y lo que a los grandes no les conviene hacer. Tenemos tres hipótesis, en este orden.
        </p>

        <div className="border border-black/[0.09] mt-6">
          {[
            {
              label: 'hipótesis 1',
              title: 'Pagar los servicios de tu familia desde otro país.',
              // TODO(irwing): número de conversaciones con usuarios y qué dijeron
              desc: 'México recibe cerca de 63 mil millones de dólares en remesas al año, y casi la mitad de las que llegan por medios electrónicos aún se cobra en efectivo. El dinero cruza la frontera en segundos y después alguien hace fila para pagar la luz. Con open402, quien vive fuera escribe <strong>"paga la luz de mi mamá"</strong> y el recibo queda pagado, sin efectivo de por medio.<br/><em>Estado: hipótesis.</em>',
            },
            {
              label: 'hipótesis 2',
              title: 'El agente que se adelanta.',
              // TODO(irwing): estado de la hipótesis 2
              desc: 'En lugar de esperar la orden, avisa: llegó tu recibo, cuánto es y cuándo vence. Si cabe en tus reglas, lo paga. Con el tiempo conoce las referencias, fechas y permisos de cada hogar.',
            },
            {
              label: 'hipótesis 3',
              title: 'Permisos que funcionan en cualquier riel.',
              desc: 'Cada proveedor de pagos construirá permisos para su propio riel. Un mandato del usuario que sirva sobre cualquiera es lo que ninguno hará por su competidor.<br/><em>Estado: visión a largo plazo.</em>',
            },
          ].map(({ label, title, desc }) => (
            <div key={label} className="grid grid-cols-[160px_1fr] border-b border-black/[0.09] last:border-b-0">
              <div className="font-mono text-[10px] tracking-[0.06em] text-ink-4 px-[14px] py-4 border-r border-black/[0.09] leading-relaxed">{label}</div>
              <div className="px-[18px] py-4">
                <div className="text-sm font-medium text-ink mb-1">{title}</div>
                <div className="text-xs text-ink-3 font-[300] leading-relaxed" dangerouslySetInnerHTML={{ __html: desc }} />
              </div>
            </div>
          ))}
        </div>
        {/* TODO(irwing): Prioridad actual — cuál de las tres hipótesis */}
      </section>

      {/* ── 8 · DÓNDE ESTÁN LOS DEMÁS ──────────────── */}
      <section className="max-w-[680px] mx-auto px-5 py-9 border-b border-black/[0.09]">
        <span className="font-mono text-[10px] tracking-[0.1em] text-ink-4 block mb-[10px]">dónde están los demás</span>
        <h2 className="font-display text-2xl text-ink leading-tight m-0 mb-1.5">No estamos solos, y está bien decirlo.</h2>

        <div className="border border-black/[0.09] mt-6 overflow-x-auto">
          <div className="min-w-[560px]">
            <div className="grid grid-cols-[140px_1fr_1fr] border-b border-black/[0.09]">
              <span className="font-mono text-[10px] tracking-[0.06em] text-ink-4 px-3 py-2.5 border-r border-black/[0.09]">Quién</span>
              <span className="font-mono text-[10px] tracking-[0.06em] text-ink-4 px-3 py-2.5 border-r border-black/[0.09]">Qué hace hoy</span>
              <span className="font-mono text-[10px] tracking-[0.06em] text-ink-4 px-3 py-2.5">Qué deja abierto</span>
            </div>
            {/* TODO(irwing): fila de Félix Pago pendiente de verificar si ya paga
                recibos directamente — "Remesas por WhatsApp con IA y stablecoins |
                Entrega dinero; el recibo lo paga la familia" */}
            {[
              { quien: 'Visa y Mastercard', hoy: 'Pagos agénticos con tarjeta; pilotos con bancos en México y la región', abierto: 'Pago de recibos locales; usuarios sin tarjeta', destacado: false },
              { quien: 'Stripe', hoy: 'Protocolos para comercios y pagos entre máquinas', abierto: 'Recibos mexicanos y SPEI de punta a punta', destacado: false },
              { quien: 'tapi y agregadores', hoy: 'Pago de servicios dentro de apps bancarias', abierto: 'Agentes y reglas del usuario final', destacado: false },
              { quien: 'Apps de cada proveedor', hoy: 'Pago directo de su propio recibo', abierto: 'Una app por servicio; difícil desde el extranjero', destacado: false },
              { quien: 'open402', hoy: 'Pago de servicios por un agente, con reglas del usuario', abierto: 'Escala, distribución y licencias propias', destacado: true },
            ].map(({ quien, hoy, abierto, destacado }) => (
              <div key={quien} className="grid grid-cols-[140px_1fr_1fr] border-b border-black/[0.09] last:border-b-0">
                <div className={`text-xs px-3 py-2.5 border-r border-black/[0.09] leading-relaxed ${destacado ? 'font-medium text-amber' : 'font-medium text-ink'}`}>{quien}</div>
                <div className="text-[11.5px] text-ink-3 px-3 py-2.5 border-r border-black/[0.09] leading-relaxed font-[300]">{hoy}</div>
                <div className="text-[11.5px] text-ink-3 px-3 py-2.5 leading-relaxed font-[300]">{abierto}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-ink-3 font-[300] leading-relaxed m-0 mt-3 max-w-[540px]">
          Nuestra ventaja no es que nadie más pueda hacerlo. Es llegar primero a un caso de uso concreto y construir sobre él.
        </p>
      </section>

      {/* ── 9 · POR QUÉ AHORA ──────────────────────── */}
      <section id="mercado" className="max-w-[680px] mx-auto px-5 py-9 border-b border-black/[0.09]">
        <span className="font-mono text-[10px] tracking-[0.1em] text-ink-4 block mb-[10px]">por qué ahora</span>
        <h2 className="font-display text-2xl text-ink leading-tight m-0 mb-1.5">El momento</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-6">
          {[
            { n: 'mar 2026', l: 'Santander y Visa completan pagos hechos por agentes de IA', d: 'En cinco países, México incluido.', accent: true },
            { n: 'abr 2026', l: 'La Linux Foundation anuncia la x402 Foundation', d: 'Con Coinbase, Google, Visa y Mastercard entre quienes la respaldan.' },
            { n: '15.8%', l: 'de la población ya paga servicios por transferencia', d: 'Casi el doble que tres años antes.' },
            { n: '46.7%', l: 'de las remesas electrónicas a México todavía se cobra en efectivo', d: '' },
          ].map(({ n, l, d, accent }) => (
            <div key={l} className={`border border-black/[0.09] px-5 py-[18px] ${accent ? 'border-amber/30 bg-[rgba(250,238,218,0.35)]' : ''}`}>
              <div className={`font-mono text-[22px] font-medium m-0 mb-1 ${accent ? 'text-amber' : 'text-ink'}`}>{n}</div>
              <div className="text-xs font-medium text-ink mb-1">{l}</div>
              {d && <div className="text-[11.5px] text-ink-3 font-[300] leading-relaxed">{d}</div>}
            </div>
          ))}
        </div>

        <div className="border border-black/[0.09] px-5 py-[18px]">
          <span className="font-mono text-[9.5px] tracking-[0.06em] text-ink-4 block mb-[7px]">nota honesta</span>
          <p className="text-xs text-ink-3 font-[300] leading-relaxed m-0">
            El volumen real de x402 aún es pequeño: en octubre de 2026 fueron 5.1 millones de transacciones por unos 274 mil dólares. Por eso open402 no depende de micropagos; empieza por pagos de servicios, que tienen montos reales.
          </p>
        </div>
      </section>

      {/* ── 10 · MODELO DE NEGOCIO ─────────────────── */}
      <section className="max-w-[680px] mx-auto px-5 py-9 border-b border-black/[0.09]">
        <span className="font-mono text-[10px] tracking-[0.1em] text-ink-4 block mb-[10px]">modelo de negocio</span>
        <h2 className="font-display text-2xl text-ink leading-tight m-0 mb-1.5">Cómo se sostiene</h2>

        <div className="border border-black/[0.09] mt-6">
          {/* TODO(irwing): comisión o cuota real por pago de servicio ejecutado */}
          {/* TODO(irwing): confirmar el 1.5% por transacción para fintechs y wallets */}
          {/* TODO(irwing): línea "No custodiamos fondos: operamos con socios regulados."
              — publicar solo si es cierto hoy y nombrando al socio */}
          {[
            'El SDK es abierto y gratuito.',
            'open402 gana por cada pago de servicio ejecutado.',
            'Fintechs y wallets pueden integrarlo para sus propios usuarios, con políticas por usuario.',
          ].map((punto, i) => (
            <div key={punto} className="grid grid-cols-[32px_1fr] border-b border-black/[0.09] last:border-b-0">
              <span className="font-mono text-[10px] text-ink-4 px-2.5 py-2.5 border-r border-black/[0.09]">0{i + 1}</span>
              <div className="text-xs text-ink leading-relaxed px-3 py-2.5">{punto}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 11 · PREGUNTAS ABIERTAS ────────────────── */}
      <section className="max-w-[680px] mx-auto px-5 py-9 border-b border-black/[0.09]">
        <span className="font-mono text-[10px] tracking-[0.1em] text-ink-4 block mb-[10px]">lo que todavía no sabemos</span>
        <h2 className="font-display text-2xl text-ink leading-tight m-0 mb-1.5">Preguntas abiertas</h2>

        <div className="border border-black/[0.09] mt-6">
          {/* TODO(irwing): agregar tus dudas reales a esta lista */}
          {[
            '¿Esto es una empresa, o una función que conviene ofrecerle a una fintech?',
            '¿Cuál de las tres hipótesis tiene el dolor más fuerte?',
            '¿Qué pasa cuando un jugador de remesas agregue pago de servicios?',
            '¿Con qué socio regulado conviene operar?',
          ].map((pregunta, i) => (
            <div key={pregunta} className="grid grid-cols-[32px_1fr] border-b border-black/[0.09] last:border-b-0">
              <span className="font-mono text-[10px] text-ink-4 px-2.5 py-2.5 border-r border-black/[0.09]">0{i + 1}</span>
              <div className="text-xs text-ink leading-relaxed px-3 py-2.5">{pregunta}</div>
            </div>
          ))}
        </div>
        {/* TODO(irwing): línea de contacto "Si tienes una opinión sobre alguna,
            escríbenos." + correo o enlace */}
      </section>

      {/* ── 12 · QUIÉN LO CONSTRUYE ────────────────── */}
      <section className="max-w-[680px] mx-auto px-5 py-9 border-b border-black/[0.09]">
        <span className="font-mono text-[10px] tracking-[0.1em] text-ink-4 block mb-[10px]">quién lo construye</span>
        <p className="text-sm text-ink-3 font-[300] max-w-[540px] leading-relaxed m-0">
          open402 lo desarrolla <strong className="font-medium text-ink">Irwing Duran Rugerio</strong>, ingeniero de software con más de cuatro años construyendo productos web, blockchain y agentes de IA. Fue co-fundador técnico de Urbánika y es mentor de hackathons, speaker e instructor.
        </p>
        {/* TODO(irwing): uno o dos logros concretos con número; enlaces a
            irwingduran.com y GitHub */}
      </section>

      {/* ── 13 · MÁS ADELANTE ──────────────────────── */}
      <section className="max-w-[680px] mx-auto px-5 py-9 border-b border-black/[0.09]">
        <span className="font-mono text-[10px] tracking-[0.1em] text-ink-4 block mb-[10px]">más adelante</span>
        <div className="flex flex-col gap-1.5">
          {[
            'Pagos entre agentes y APIs vía x402 como canal principal.',
            'Rendimiento sobre el saldo en instrumentos respaldados por CETES.',
            'Otros países de Latinoamérica.',
          ].map((punto) => (
            <p key={punto} className="font-mono text-[10.5px] text-ink-4 leading-relaxed m-0">— {punto}</p>
          ))}
        </div>
      </section>

      {/* ── 14 · CIERRE Y PIE ──────────────────────── */}
      <section className="max-w-[680px] mx-auto px-5 py-14 pb-11 text-center">
        <h2 className="font-display text-[34px] leading-[1.08] text-ink m-0 mb-7">
          Dale a tu agente la capacidad<br />de pagar, <em className="italic text-amber not-italic">sin soltar el control.</em>
        </h2>
        <div className="flex gap-2.5 justify-center flex-wrap mb-[14px]">
          <SignedOut>
            <SignInButton>
              <button className="font-mono text-[11px] px-[22px] py-[11px] bg-ink text-white cursor-pointer hover:bg-ink-2 transition-colors border-none tracking-[0.02em]">
                npm install @open402/agents →
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <a href="/dashboard" className="font-mono text-[11px] px-[22px] py-[11px] bg-ink text-white no-underline hover:bg-ink-2 transition-colors tracking-[0.02em]">
              npm install @open402/agents →
            </a>
          </SignedIn>
          <a href="/sdk" className="font-mono text-[11px] px-[22px] py-[11px] bg-transparent text-ink border border-black/[0.09] no-underline cursor-pointer hover:border-black/30 transition-colors">
            Leer la documentación
          </a>
          <a href="https://github.com/Irwingduran/open402.git" className="font-mono text-[11px] px-[22px] py-[11px] bg-transparent text-ink border border-black/[0.09] no-underline cursor-pointer hover:border-black/30 transition-colors">
            ★ Ver en GitHub
          </a>
        </div>

        {/* TODO(irwing): quitar del pie las tecnologías que no estén en uso real */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center mt-[18px] pt-[18px] border-t border-black/[0.09]">
          <span className="font-mono text-[9.5px] text-ink-4 tracking-[0.1em] mr-2">construido sobre</span>
          {['Arbitrum One', 'Coinbase CDP', 'x402 Protocol', 'Etherfuse', 'Prontipagos', 'Bitso MXNB', 'Ethereum', 'Opus 4.7'].map((item, i, arr) => (
            <span key={item}>
              <span className="font-mono text-[10.5px] font-medium text-ink-3">{item}</span>
              {i < arr.length - 1 && <span className="text-ink-4 text-[10px] mx-1">·</span>}
            </span>
          ))}
        </div>
      </section>

    </div>
  );
}
