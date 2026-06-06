import { auth } from '@clerk/nextjs/server';
import { prisma } from '@open402/db';
import { createQuote, createOrder, isEtherfuseConfigured, getEtherfuseOrgId } from '@/lib/etherfuse';

async function getUserId(req: Request, body: { userId?: string }): Promise<string | null> {
  const apiKey = req.headers.get('authorization')?.replace('Bearer ', '');
  if (apiKey) return body.userId ?? null;
  const { userId } = await auth();
  return userId;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { amountMXN } = body;
  const userId = await getUserId(req, body);
  if (!userId) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (amountMXN < 100 || amountMXN > 50000) {
    return Response.json({ error: 'Monto debe estar entre 100 y 50,000 MXN' }, { status: 400 });
  }

  try {
    const quoteId = crypto.randomUUID();
    const orderId = crypto.randomUUID();
    const orgId = getEtherfuseOrgId();

    const quote = await createQuote({
      quoteId,
      customerId: orgId,
      blockchain: 'solana',
      quoteAssets: {
        type: 'onramp',
        sourceAsset: 'MXN',
        targetAsset: 'AvvetPGuuB5FD5m86fpw3LtDKyQoUFT1mG9WarNQLW4q',
      },
      sourceAmount: String(amountMXN),
    });

    const orderResp = await createOrder({
      orderId,
      bankAccountId: orgId,
      quoteId,
    });

    const onramp = 'onramp' in orderResp ? orderResp.onramp : null;

    await prisma.investment.create({
      data: {
        userId,
        amountMXN,
        orderId,
        quoteId,
        status: onramp ? 'awaiting_deposit' : 'pending',
        depositClabe: onramp?.depositClabe ?? null,
        depositBankName: onramp?.depositBankName ?? null,
        depositAccountHolder: onramp?.depositAccountHolder ?? null,
        mock: !isEtherfuseConfigured(),
        expiresAt: new Date(Date.now() + 120000),
      },
    });

    return Response.json({
      success: true,
      quote,
      order: onramp ? {
        orderId: onramp.orderId,
        depositClabe: onramp.depositClabe,
        depositAmount: onramp.depositAmount,
        depositBankName: onramp.depositBankName,
        depositAccountHolder: onramp.depositAccountHolder,
        status: 'awaiting_deposit',
      } : null,
      mock: !isEtherfuseConfigured(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
