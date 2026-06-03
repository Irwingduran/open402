const BITSO_API_BASE = process.env.BITSO_API_URL ?? 'https://api.bitso.com/v3';
const BITSO_API_KEY = process.env.BITSO_API_KEY ?? '';
const BITSO_API_SECRET = process.env.BITSO_API_SECRET ?? '';

interface BitsoQuoteRequest {
  source_currency: string;
  target_currency: string;
  source_amount: number;
}

interface BitsoQuote {
  id: string;
  source_currency: string;
  target_currency: string;
  source_amount: number;
  target_amount: number;
  rate: number;
  expires_at: string;
  created_at: string;
}

interface BitsoDepositInstructions {
  deposit_id: string;
  clabe: string;
  reference: string;
  amount: number;
  currency: string;
  concept: string;
  expires_at: string;
}

interface BitsoDepositStatus {
  deposit_id: string;
  status: 'pending' | 'confirmed' | 'failed' | 'expired';
  amount: number;
  currency: string;
  confirmed_amount?: number;
  confirmed_at?: string;
  created_at: string;
}

const IS_MOCK = !BITSO_API_KEY || !BITSO_API_SECRET;

function generateId(): string {
  return `spx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function bitsoRequest<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  if (IS_MOCK) {
    return handleMockRequest<T>(method, path, body);
  }

  const nonce = String(Date.now());
  const url = `${BITSO_API_BASE}${path}`;
  const payload = body ? JSON.stringify(body) : '';
  const signature = await generateSignature(nonce, method, path, payload);

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bitso ${BITSO_API_KEY}:${nonce}:${signature}`,
      'Content-Type': 'application/json',
    },
    body: payload || undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bitso API error (${res.status}): ${err}`);
  }

  const json = await res.json();
  return json.payload ?? json;
}

async function generateSignature(
  nonce: string,
  method: string,
  path: string,
  payload: string,
): Promise<string> {
  const data = `${nonce}${method}${path}${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(BITSO_API_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// --- Mock handlers for development ---

const mockState = new Map<string, BitsoDepositStatus>();

async function handleMockRequest<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  await sleep(300);

  if (method === 'POST' && path === '/fx/rate') {
    return {
      source_currency: body?.source_currency ?? 'MXN',
      target_currency: body?.target_currency ?? 'USDC',
      rate: 0.0000485,
      rate_inverse: 20618.56,
      source_amount: body?.source_amount ?? 100,
      target_amount: Math.floor((body?.source_amount as number) * 0.0000485 * 100) / 100,
      expires_at: new Date(Date.now() + 30000).toISOString(),
    } as T;
  }

  if (method === 'POST' && path === '/fx/quote') {
    const rate = 0.0000485;
    const sourceAmount = body?.source_amount as number;
    const targetAmount = Math.floor(sourceAmount * rate * 100) / 100;
    return {
      id: generateId(),
      source_currency: 'MXN',
      target_currency: 'USDC',
      source_amount: sourceAmount,
      target_amount: targetAmount,
      rate,
      expires_at: new Date(Date.now() + 60000).toISOString(),
      created_at: new Date().toISOString(),
    } as T;
  }

  if (method === 'POST' && path.startsWith('/fx/quote/') && path.endsWith('/accept')) {
    const quoteId = path.split('/')[3];
    const depositId = `dep_${Date.now()}`;
    const amount = (body?.source_amount as number) ?? 100;
    const status: BitsoDepositStatus = {
      deposit_id: depositId,
      status: 'pending',
      amount,
      currency: 'MXN',
      created_at: new Date().toISOString(),
    };
    mockState.set(depositId, status);

    return {
      deposit_id: depositId,
      clabe: '646180115400345678',
      reference: `OPEN${String(Date.now()).slice(-8)}`,
      amount,
      currency: 'MXN',
      concept: 'Compra de créditos open402',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    } as T;
  }

  if (method === 'GET' && path.startsWith('/fx/deposit/')) {
    const depositId = path.split('/')[3];
    const status = mockState.get(depositId);
    if (!status) {
      throw new Error(`Deposit not found: ${depositId}`);
    }

    if (status.status === 'pending' && Date.now() - new Date(status.created_at).getTime() > 5000) {
      status.status = 'confirmed';
      status.confirmed_amount = status.amount;
      status.confirmed_at = new Date().toISOString();
      mockState.set(depositId, status);
    }

    return status as T;
  }

  throw new Error(`Mock not implemented: ${method} ${path}`);
}

// --- Public API ---

export async function getRate(
  sourceCurrency: string,
  targetCurrency: string,
  sourceAmount: number,
): Promise<{ rate: number; targetAmount: number; expiresAt: string }> {
  const result = await bitsoRequest<Record<string, unknown>>('POST', '/fx/rate', {
    source_currency: sourceCurrency,
    target_currency: targetCurrency,
    source_amount: sourceAmount,
  });
  return {
    rate: result.rate as number,
    targetAmount: result.target_amount as number,
    expiresAt: result.expires_at as string,
  };
}

export async function createQuote(
  sourceCurrency: string,
  targetCurrency: string,
  sourceAmount: number,
): Promise<BitsoQuote> {
  const quote = await bitsoRequest<BitsoQuote>('POST', '/fx/quote', {
    source_currency: sourceCurrency,
    target_currency: targetCurrency,
    source_amount: sourceAmount,
  });
  return quote;
}

export async function acceptQuote(
  quoteId: string,
  sourceAmount: number,
): Promise<BitsoDepositInstructions> {
  const instructions = await bitsoRequest<BitsoDepositInstructions>(
    'POST',
    `/fx/quote/${quoteId}/accept`,
    { source_amount: sourceAmount },
  );
  return instructions;
}

export async function checkDepositStatus(
  depositId: string,
): Promise<BitsoDepositStatus> {
  const status = await bitsoRequest<BitsoDepositStatus>(
    'GET',
    `/fx/deposit/${depositId}`,
  );
  return status;
}

export function isBitsoConfigured(): boolean {
  return !IS_MOCK;
}
