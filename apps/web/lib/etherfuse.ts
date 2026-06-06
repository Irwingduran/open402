const ETHERFUSE_API_BASE = process.env.ETHERFUSE_API_URL ?? 'https://api.sand.etherfuse.com';
const ETHERFUSE_API_KEY = process.env.ETHERFUSE_API_KEY ?? '';

type AssetBlockchain = 'solana' | 'stellar' | 'base' | 'polygon' | 'monad';
type QuoteType = 'onramp' | 'offramp' | 'swap';
type OrderStatus = 'created' | 'funded' | 'completed' | 'failed' | 'refunded' | 'canceled' | 'finalized';

interface EtherfuseRampableAsset {
  symbol: string;
  identifier: string;
  name: string;
  currency: string;
  balance: string | null;
  image: string | null;
}

interface EtherfuseQuoteRequest {
  quoteId: string;
  customerId: string;
  blockchain: AssetBlockchain;
  quoteAssets: {
    type: QuoteType;
    sourceAsset: string;
    targetAsset: string;
  };
  sourceAmount: string;
  walletAddress?: string;
  partnerFeeBps?: number;
}

interface EtherfuseQuote {
  quoteId: string;
  blockchain: AssetBlockchain;
  quoteAssets: {
    type: QuoteType;
    sourceAsset: string;
    targetAsset: string;
  };
  sourceAmount: string;
  destinationAmount: string;
  feeBps: string;
  feeAmount: string;
  exchangeRate: string;
  nominalRate?: string;
  requiresSwap?: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

interface EtherfuseOrderRequest {
  orderId: string;
  bankAccountId: string;
  quoteId: string;
  publicKey?: string;
  cryptoWalletId?: string;
  memo?: string;
  useAnchor?: boolean;
}

interface EtherfuseOrder {
  orderId: string;
  customerId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  completedAt: string | null;
  amountInFiat: number | null;
  amountInTokens: number | null;
  confirmedTxSignature: string | null;
  walletId: string;
  bankAccountId: string;
  burnTransaction: string | null;
  isAnchorOrder: boolean | null;
  withdrawAnchorAccount: string | null;
  withdrawMemo: string | null;
  withdrawMemoType: string | null;
  memo: string | null;
  depositClabe: string | null;
  depositBankName: string | null;
  depositAccountHolder: string | null;
  orderType: 'onramp' | 'offramp';
  status: OrderStatus;
  statusPage: string;
  feeBps: number | null;
  feeAmountInFiat: number | null;
  exchangeRate: string | null;
  etherfuseMidMarketRate: string | null;
  sourceAsset: string | null;
  targetAsset: string | null;
  stellarClaimableBalanceId: string | null;
  stellarClaimTransaction: string | null;
  partnerFeeBps: number | null;
  partnerFeeAmountFiat: number | null;
  partnerFeeStatus: 'none' | 'pending' | 'disbursed' | null;
}

interface EtherfuseOnrampOrderResponse {
  onramp: {
    orderId: string;
    depositClabe: string;
    depositAmount: number;
    depositBankName: string;
    depositAccountHolder: string;
  };
}

interface EtherfuseOfframpOrderResponse {
  offramp: {
    orderId: string;
    withdrawAnchorAccount?: string | null;
    withdrawMemo?: string | null;
    withdrawMemoType?: string | null;
  };
}

interface EtherfuseStablebond {
  symbol: string;
  netAmountDecimal: string;
  netValueDecimal: string;
  bondCurrency: string;
  tokenPriceDecimal: string;
  purchaseOrderAmount: string;
  redeemOrderAmount: string;
  blockchains: {
    blockchain: string;
    tokenIdentifier: string;
    totalSupply: string;
  }[];
  solanaMintAddress: string;
}

interface EtherfuseStablebondsResponse {
  calculatedAt: string;
  stablebonds: EtherfuseStablebond[];
}

interface EtherfuseWebhookRequest {
  id: string;
  eventType: 'bank_account_updated' | 'customer_updated' | 'order_updated' | 'swap_updated' | 'kyc_updated';
  url: string;
}

interface EtherfuseWebhookResponse {
  id: string;
  eventType: string;
  url: string;
  secret: string;
  createdAt: string;
  updatedAt: string;
}

const IS_MOCK = !ETHERFUSE_API_KEY;

function extractOrgId(): string {
  if (IS_MOCK) return 'mock-org-id';
  const parts = ETHERFUSE_API_KEY.split(':');
  return parts.length >= 3 ? parts[2] : 'mock-org-id';
}

const mockQuotes = new Map<string, EtherfuseQuote>();
const mockOrders = new Map<string, EtherfuseOrder>();

function generateId(): string {
  return `eth_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function etherfuseRequest<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  if (IS_MOCK) {
    return handleMockRequest<T>(method, path, body);
  }

  const url = `${ETHERFUSE_API_BASE}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: ETHERFUSE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Etherfuse API error (${res.status}): ${err}`);
  }

  return res.json();
}

async function handleMockRequest<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  await sleep(400);

  if (method === 'GET' && path.startsWith('/ramp/assets')) {
    return {
      assets: [
        { symbol: 'CETES', identifier: 'AvvetPGuuB5FD5m86fpw3LtDKyQoUFT1mG9WarNQLW4q', name: 'CETES', currency: 'mxn', balance: null, image: null },
        { symbol: 'EMXN', identifier: 'eMXNt9SFtZ2b1N953LZfu4Vf3wgANS65dpzrJEiE83T', name: 'EMXN', currency: 'mxn', balance: null, image: null },
        { symbol: 'USDC', identifier: 'BXTou3CvPxpFVAJvzvEZcAnRLGCHqT1LHKsFTSQft7s', name: 'USDC', currency: 'usd', balance: null, image: null },
      ],
    } as T;
  }

  if (method === 'GET' && path === '/lookup/stablebonds') {
    return {
      calculatedAt: new Date().toISOString(),
      stablebonds: [
        {
          symbol: 'CETES',
          netAmountDecimal: '488578259.677856',
          netValueDecimal: '554535347.577847',
          bondCurrency: 'MXN',
          tokenPriceDecimal: '1.134998',
          purchaseOrderAmount: '286099.441742',
          redeemOrderAmount: '0',
          blockchains: [
            { blockchain: 'solana', tokenIdentifier: 'AvvetPGuuB5FD5m86fpw3LtDKyQoUFT1mG9WarNQLW4q', totalSupply: '402125226.408225' },
            { blockchain: 'stellar', tokenIdentifier: 'CETES:GC3CW7EDYRTWQ635VDIGY6S4ZUF5L6TQ7AA4MWS7LEQDBLUSZXV7UPS4', totalSupply: '86051402.8699335' },
          ],
          solanaMintAddress: 'AvvetPGuuB5FD5m86fpw3LtDKyQoUFT1mG9WarNQLW4q',
        },
      ],
    } as T;
  }

  if (method === 'POST' && path === '/ramp/quote') {
    const sourceAmount = Number((body?.sourceAmount as string) ?? '100');
    const feeBps = '20';
    const feeAmount = ((sourceAmount * Number(feeBps)) / 10000).toFixed(2);
    const destinationAmount = (sourceAmount - Number(feeAmount)).toFixed(2);
    const now = new Date();

    const quote: EtherfuseQuote = {
      quoteId: (body?.quoteId as string) ?? generateId(),
      blockchain: (body?.blockchain as AssetBlockchain) ?? 'solana',
      quoteAssets: (body?.quoteAssets as EtherfuseQuoteRequest['quoteAssets']) ?? { type: 'onramp', sourceAsset: 'MXN', targetAsset: 'CETES' },
      sourceAmount: sourceAmount.toFixed(2),
      destinationAmount,
      feeBps,
      feeAmount,
      exchangeRate: (destinationAmount === '0' ? '0' : (Number(destinationAmount) / sourceAmount).toFixed(6)),
      nominalRate: (destinationAmount === '0' ? '0' : ((Number(destinationAmount) + 0.5) / sourceAmount).toFixed(6)),
      requiresSwap: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 120000).toISOString(),
    };

    mockQuotes.set(quote.quoteId, quote);
    return quote as T;
  }

  if (method === 'POST' && path === '/ramp/order') {
    const quoteId = body?.quoteId as string;
    const quote = mockQuotes.get(quoteId);
    const sourceAmount = quote ? Number(quote.sourceAmount) : 1000;
    const now = new Date();

    const orderId = (body?.orderId as string) ?? generateId();
    const order: EtherfuseOrder = {
      orderId,
      customerId: (body?.bankAccountId as string)?.replace('_bank', '') ?? 'mock-customer-id',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      deletedAt: null,
      completedAt: null,
      amountInFiat: sourceAmount,
      amountInTokens: null,
      confirmedTxSignature: null,
      walletId: (body?.cryptoWalletId as string) ?? 'mock-wallet-id',
      bankAccountId: (body?.bankAccountId as string) ?? 'mock-bank-id',
      burnTransaction: null,
      isAnchorOrder: null,
      withdrawAnchorAccount: null,
      withdrawMemo: null,
      withdrawMemoType: null,
      memo: (body?.memo as string) ?? null,
      depositClabe: '646180115400345678',
      depositBankName: 'STP',
      depositAccountHolder: 'Etherfuse MX',
      orderType: 'onramp',
      status: 'created',
      statusPage: `https://devnet.etherfuse.com/ramp/order/${orderId}`,
      feeBps: quote ? Number(quote.feeBps) : 20,
      feeAmountInFiat: quote ? Number(quote.feeAmount) : null,
      exchangeRate: quote?.exchangeRate ?? null,
      etherfuseMidMarketRate: quote?.nominalRate ?? null,
      sourceAsset: 'MXN',
      targetAsset: quote?.quoteAssets?.targetAsset ?? 'CETES',
      stellarClaimableBalanceId: null,
      stellarClaimTransaction: null,
      partnerFeeBps: null,
      partnerFeeAmountFiat: null,
      partnerFeeStatus: null,
    };

    mockOrders.set(orderId, order);

    return {
      onramp: {
        orderId,
        depositClabe: '646180115400345678',
        depositAmount: sourceAmount,
        depositBankName: 'STP',
        depositAccountHolder: 'Etherfuse MX',
      },
    } as T;
  }

  if (method === 'POST' && path === '/ramp/order/fiat_received') {
    const orderId = body?.orderId as string;
    const order = mockOrders.get(orderId);
    if (!order) throw new Error(`Order not found: ${orderId}`);

    order.status = 'completed';
    order.completedAt = new Date().toISOString();
    order.confirmedTxSignature = `mock_tx_${Date.now().toString(36)}`;
    order.amountInTokens = order.amountInFiat ? Number((order.amountInFiat / 1.135).toFixed(6)) : null;
    mockOrders.set(orderId, order);

    return { status: 'completed', confirmedTxSignature: order.confirmedTxSignature } as T;
  }

  if (method === 'GET' && path.startsWith('/ramp/order/')) {
    const orderId = path.replace('/ramp/order/', '');
    if (orderId === 'fiat_received') throw new Error(`Mock not implemented: ${method} ${path}`);
    const order = mockOrders.get(orderId);
    if (!order) throw new Error(`Order not found: ${orderId}`);

    return order as T;
  }

  if (method === 'POST' && path === '/ramp/webhook') {
    return {
      id: body?.id as string ?? generateId(),
      eventType: body?.eventType as string ?? 'order_updated',
      url: body?.url as string ?? 'https://example.com/webhook',
      secret: Buffer.from(`mock_secret_${generateId()}`).toString('base64'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as T;
  }

  throw new Error(`Mock not implemented: ${method} ${path}`);
}

export async function getRampableAssets(blockchain: AssetBlockchain, currency: string, wallet: string): Promise<EtherfuseRampableAsset[]> {
  const res = await etherfuseRequest<{ assets: EtherfuseRampableAsset[] }>(
    'GET',
    `/ramp/assets?blockchain=${blockchain}&currency=${currency}&wallet=${wallet}`,
  );
  return res.assets;
}

export async function getStablebonds(): Promise<EtherfuseStablebondsResponse> {
  return etherfuseRequest<EtherfuseStablebondsResponse>('GET', '/lookup/stablebonds');
}

export async function createQuote(req: EtherfuseQuoteRequest): Promise<EtherfuseQuote> {
  return etherfuseRequest<EtherfuseQuote>('POST', '/ramp/quote', req as unknown as Record<string, unknown>);
}

export async function createOrder(req: EtherfuseOrderRequest): Promise<EtherfuseOnrampOrderResponse | EtherfuseOfframpOrderResponse> {
  return etherfuseRequest<EtherfuseOnrampOrderResponse | EtherfuseOfframpOrderResponse>('POST', '/ramp/order', req as unknown as Record<string, unknown>);
}

export async function simulateFiatReceived(orderId: string): Promise<{ status: string; confirmedTxSignature?: string }> {
  return etherfuseRequest<{ status: string; confirmedTxSignature?: string }>(
    'POST',
    '/ramp/order/fiat_received',
    { orderId },
  );
}

export async function getOrderStatus(orderId: string): Promise<EtherfuseOrder> {
  return etherfuseRequest<EtherfuseOrder>('GET', `/ramp/order/${orderId}`);
}

export async function createWebhook(req: EtherfuseWebhookRequest): Promise<EtherfuseWebhookResponse> {
  return etherfuseRequest<EtherfuseWebhookResponse>('POST', '/ramp/webhook', req as unknown as Record<string, unknown>);
}

export function isEtherfuseConfigured(): boolean {
  return !IS_MOCK;
}

export function getEtherfuseOrgId(): string {
  return extractOrgId();
}

export type {
  EtherfuseRampableAsset,
  EtherfuseQuoteRequest,
  EtherfuseQuote,
  EtherfuseOrderRequest,
  EtherfuseOrder,
  EtherfuseOnrampOrderResponse,
  EtherfuseOfframpOrderResponse,
  EtherfuseStablebond,
  EtherfuseStablebondsResponse,
  EtherfuseWebhookRequest,
  EtherfuseWebhookResponse,
  AssetBlockchain,
  QuoteType,
  OrderStatus,
};
