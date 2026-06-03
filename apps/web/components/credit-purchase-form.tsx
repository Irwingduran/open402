'use client';

import { useState } from 'react';

export function CreditPurchaseForm() {
  const [amount, setAmount] = useState(100);
  const [method, setMethod] = useState<'card' | 'oxxo' | 'spei'>('card');
  const [loading, setLoading] = useState(false);

  const estimatedCredits = amount * 100;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountMXN: amount, paymentMethod: method }),
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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
      <div>
        <label className="block text-sm font-medium">Monto en MXN</label>
        <input
          type="number"
          min={50}
          max={10000}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Método de pago</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as typeof method)}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        >
          <option value="card">Tarjeta (Conekta)</option>
          <option value="oxxo">OXXO</option>
          <option value="spei">SPEI</option>
        </select>
      </div>

      <p className="text-sm text-gray-600">
        Recibirás aproximadamente <strong>{estimatedCredits.toLocaleString()} créditos</strong>
      </p>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Procesando...' : 'Comprar créditos'}
      </button>
    </form>
  );
}
