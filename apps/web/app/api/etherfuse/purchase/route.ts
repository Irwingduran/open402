import { auth } from '@clerk/nextjs/server';
import { createQuote, createOrder, isEtherfuseConfigured, getEtherfuseOrgId } from '@/lib/etherfuse';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { amountMXN } = await req.json();

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

    return Response.json({
      success: true,
      quote,
      order: onramp ? {
        orderId: onramp.orderId,
        depositClabe: onramp.depositClabe,
        depositAmount: onramp.depositAmount,
        depositBankName: onramp.depositBankName,
        depositAccountHolder: onramp.depositAccountHolder,
        status: 'created',
      } : null,
      mock: !isEtherfuseConfigured(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
