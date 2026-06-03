'use client';

import { useState } from 'react';

export function CreditPurchaseForm() {
  const [amount, setAmount] = useState(500);
  const [loading, setLoading] = useState(false);

  const estimatedCredits = amount * 100;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountMXN: amount, paymentMethod: 'spei' }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      } else {
        alert(data.error ?? 'Error al comprar créditos');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-black/10 bg-white p-6">
      <div>
        <label className="text-xs font-mono text-slate-500 block mb-1.5">Monto en MXN</label>
        <input
          type="number"
          min={50}
          max={10000}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full text-sm font-mono px-3 py-2.5 rounded-lg border border-black/10 bg-white text-slate-700"
        />
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
        <p className="text-xs font-mono text-amber-800">
          Pago vía SPEI — Bitso
        </p>
        <p className="text-[10px] text-amber-700 mt-1 leading-relaxed">
          Transfiere el monto a la CLABE de Bitso que aparece al confirmar. Los créditos se acreditan automáticamente al recibir el pago.
        </p>
      </div>

      <div className="border-t border-black/5 pt-4">
        <p className="text-sm text-slate-700">
          Recibirás <strong className="text-amber-600">{estimatedCredits.toLocaleString()} créditos</strong>
        </p>
        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
          1 crédito ≈ $0.01 USD · 1 MXN = 100 créditos
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full text-xs font-mono font-bold px-4 py-2.5 rounded-lg bg-slate-900 text-white border-none cursor-pointer hover:bg-slate-800 transition-colors disabled:opacity-50"
      >
        {loading ? 'Procesando...' : 'Generar instrucciones SPEI'}
      </button>
    </form>
  );
}
