import { createHmac, timingSafeEqual } from 'node:crypto';
import canonicalize from 'canonicalize';
import { prisma, InvestmentStatus } from '@open402/db';
import { NextRequest } from 'next/server';

const WEBHOOK_SECRET = process.env.ETHERFUSE_WEBHOOK_SECRET;

function verifySignature(body: unknown, signatureHeader: string): boolean {
  if (!WEBHOOK_SECRET) return true;

  const canonicalized = canonicalize(body);
  if (!canonicalized) return false;

  const key = Buffer.from(WEBHOOK_SECRET, 'base64');
  const hmac = createHmac('sha256', key).update(canonicalized).digest('hex');
  const expected = `sha256=${hmac}`;

  if (expected.length !== signatureHeader.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-signature');
  if (!signature) {
    return new Response('Missing signature', { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (!verifySignature(body, signature)) {
    return new Response('Invalid signature', { status: 401 });
  }

  const payload = body as Record<string, unknown>;

  if (payload.eventType === 'order_updated') {
    const order = payload.order as Record<string, unknown> | undefined;
    if (!order?.orderId) {
      return new Response('Missing orderId', { status: 400 });
    }

    const orderId = String(order.orderId);
    const status = String(order.status ?? '');
    const confirmedTxSignature = order.confirmedTxSignature ? String(order.confirmedTxSignature) : null;
    const amountInTokens = order.amountInTokens ? Number(order.amountInTokens) : null;
    const completedAt = order.completedAt ? String(order.completedAt) : null;

    try {
      await prisma.investment.update({
        where: { orderId },
        data: {
          status: mapOrderStatus(status) as InvestmentStatus,
          cetesReceived: amountInTokens,
        },
      });
    } catch {
      // investment not found — not necessarily an error
    }
  }

  return new Response('OK', { status: 200 });
}

function mapOrderStatus(apiStatus: string): string {
  switch (apiStatus) {
    case 'created':
      return 'awaiting_deposit';
    case 'funded':
      return 'awaiting_deposit';
    case 'completed':
      return 'completed';
    case 'finalized':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'canceled':
      return 'cancelled';
    default:
      return 'pending';
  }
}
