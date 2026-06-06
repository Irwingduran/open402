'use client';

import { useState } from 'react';

interface InvestmentOrder {
  id: string;
  amountMXN: number;
  orderId: string;
  status: string;
  cetesReceived: number | null;
  depositClabe: string | null;
  depositBankName: string | null;
  mock: boolean;
  createdAt: Date;
}

interface PurchaseResult {
  orderId: string;
  depositClabe: string;
  depositAmount: string;
  depositBankName: string;
  depositAccountHolder: string;
  status: string;
}

export function InvestForm({ initialInvestments }: { initialInvestments: InvestmentOrder[] }) {
  const [amount, setAmount] = useState(500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(null);
  const [investments] = useState(initialInvestments);

  const estimatedCetes = amount * 0.5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/etherfuse/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountMXN: amount }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al procesar');
        return;
      }

      if (data.order) {
        setPurchaseResult(data.order);
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    completed: 'text-green-600 bg-green-50',
    pending: 'text-yellow-600 bg-yellow-50',
    awaiting_deposit: 'text-blue-600 bg-blue-50',
    failed: 'text-red-600 bg-red-50',
    cancelled: 'text-gray-500 bg-gray-50',
  };

  return (
    <div className="space-y-8">
      {purchaseResult ? (
        <div className="rounded-xl border border-black/10 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-green-600 text-lg">✓</span>
            <h3 className="font-semibold text-slate-800">Orden creada</h3>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
              <p className="text-xs font-mono text-blue-800 mb-2">Deposita via SPEI</p>
              <div className="space-y-1.5 text-xs text-blue-700">
                <p><span className="font-mono font-medium">CLABE:</span> <span className="font-mono">{purchaseResult.depositClabe}</span></p>
                <p><span className="font-mono font-medium">Monto:</span> <span className="font-mono">${purchaseResult.depositAmount} MXN</span></p>
                <p><span className="font-mono font-medium">Banco:</span> {purchaseResult.depositBankName}</p>
                <p><span className="font-mono font-medium">Titular:</span> {purchaseResult.depositAccountHolder}</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Una vez que el depósito se refleje, el webhook actualizará el estado automáticamente.
            </p>
            <a
              href="/invest"
              className="inline-block text-xs font-mono font-bold px-4 py-2 rounded-lg bg-slate-900 text-white no-underline hover:bg-slate-800 transition-colors"
            >
              Ver todas mis inversiones
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-black/10 bg-white p-6">
          <div>
            <label className="text-xs font-mono text-slate-500 block mb-1.5">Monto en MXN</label>
            <input
              type="number"
              min={100}
              max={50000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full text-sm font-mono px-3 py-2.5 rounded-lg border border-black/10 bg-white text-slate-700"
            />
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-xs font-mono text-amber-800">Inversión en CETES vía Etherfuse</p>
            <p className="text-[10px] text-amber-700 mt-1 leading-relaxed">
              Los CETES son el activo libre de riesgo mexicano (~10% APY nominal). Recibirás stablebonds respaldados 1:1 con CETES.
            </p>
          </div>

          <div className="border-t border-black/5 pt-4">
            <p className="text-sm text-slate-700">
              Recibirás ≈ <strong className="text-amber-600">{estimatedCetes.toLocaleString()} CETES</strong>
            </p>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5">
              Rendimiento estimado ~10% APY nominal · Monto mínimo $100 MXN
            </p>
          </div>

          {error && (
            <p className="text-xs font-mono text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-xs font-mono font-bold px-4 py-2.5 rounded-lg bg-slate-900 text-white border-none cursor-pointer hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Generando orden...' : 'Invertir ahora'}
          </button>
        </form>
      )}

      {/* Investment history */}
      <div className="rounded-xl border border-black/10 bg-white p-6">
        <h3 className="font-semibold mb-4 text-slate-800">Historial de inversiones</h3>
        {investments.length === 0 ? (
          <p className="text-sm text-slate-400">Aún no has invertido en CETES.</p>
        ) : (
          <div className="space-y-2">
            {investments.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded bg-gray-50 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-800">
                    ${inv.amountMXN.toLocaleString()} MXN
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    {inv.cetesReceived ? `${inv.cetesReceived} CETES` : '—'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${statusColors[inv.status] ?? 'text-gray-500 bg-gray-50'}`}>
                    {inv.status.replace('_', ' ')}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(inv.createdAt).toLocaleDateString('es-MX')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
