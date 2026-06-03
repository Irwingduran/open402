import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createQuote, acceptQuote, isBitsoConfigured } from '@/lib/bitso';

const EXCHANGE_RATE = 100; // 1 MXN = 100 créditos (placeholder, will use real rate)

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { amountMXN } = await req.json();

  if (amountMXN < 50 || amountMXN > 10000) {
    return Response.json({ error: 'Monto debe estar entre 50 y 10,000 MXN' }, { status: 400 });
  }

  const creditsAmount = Math.floor(amountMXN * EXCHANGE_RATE);

  try {
    if (!isBitsoConfigured()) {
      // --- Mock mode: synchronous credit (dev/test) ---
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          type: 'credit_purchase',
          status: 'completed',
          amount: creditsAmount,
          currency: 'credits',
          description: `Compra de ${creditsAmount} créditos por $${amountMXN} MXN vía SPEI (Bitso) — modo prueba`,
          metadata: { amountMXN, exchangeRate: EXCHANGE_RATE, mock: true },
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: creditsAmount } },
      });

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'completed', completedAt: new Date() },
      });

      return Response.json({
        success: true,
        creditsAmount,
        exchangeRate: EXCHANGE_RATE,
        transactionId: transaction.id,
        mock: true,
      });
    }

    // --- Real Bitso FXaaS flow ---
    const quote = await createQuote('MXN', 'USDC', amountMXN);
    const instructions = await acceptQuote(quote.id, amountMXN);

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: 'credit_purchase',
        status: 'pending',
        amount: creditsAmount,
        currency: 'credits',
        description: `Compra de ${creditsAmount} créditos por $${amountMXN} MXN vía SPEI (Bitso)`,
        metadata: {
          amountMXN,
          exchangeRate: EXCHANGE_RATE,
          bitsoQuoteId: quote.id,
          bitsoDepositId: instructions.deposit_id,
          speiClabe: instructions.clabe,
          speiReference: instructions.reference,
          usdcAmount: quote.target_amount,
        },
      },
    });

    return Response.json({
      success: true,
      transactionId: transaction.id,
      speiClabe: instructions.clabe,
      speiReference: instructions.reference,
      speiAmount: amountMXN,
      speiConcept: instructions.concept,
      speiExpiresAt: instructions.expires_at,
      exchangeRate: EXCHANGE_RATE,
      creditsAmount,
      usdcAmount: quote.target_amount,
    });
  } catch (err) {
    return Response.json({ success: false, error: 'Error al procesar la compra' }, { status: 500 });
  }
}
