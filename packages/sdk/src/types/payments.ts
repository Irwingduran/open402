export type BillService = 'cfe' | 'telmex' | 'telcel' | 'izzi';

export interface BillPaymentRequest {
  service: BillService;
  reference: string;
  amount: number;
}

export interface BillPaymentResult {
  success: boolean;
  transactionId: string;
  service: BillService;
  amount: number;
  fee: number;
  confirmationCode?: string;
}

export interface X402PaymentRequest {
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: unknown;
  maxRetries?: number;
}

export interface X402PaymentResult {
  success: boolean;
  data?: unknown;
  cost: number;
  transactionId: string;
  txHash?: string;
}

export interface CreditPurchaseRequest {
  amountMXN: number;
  paymentMethod: 'card' | 'oxxo' | 'spei';
}

export interface CreditPurchaseResult {
  success: boolean;
  creditsAmount: number;
  mxnAmount: number;
  exchangeRate: number;
  transactionId: string;
}

export interface InvestCETESRequest {
  amountMXN: number;
}

export interface InvestCETESResult {
  success: boolean;
  orderId: string;
  depositClabe: string;
  depositAmount: string;
  depositBankName: string;
  depositAccountHolder: string;
  status: string;
  mock: boolean;
}

export interface CheckInvestmentResult {
  orderId: string;
  status: string;
  depositClabe?: string;
  depositBankName?: string;
  depositAccountHolder?: string;
  amountInFiat?: string;
  amountInTokens?: string;
  confirmedTxSignature?: string;
  createdAt?: string;
  completedAt?: string;
  statusPage?: string;
}
