import { auth } from '@clerk/nextjs/server';
import { prisma } from '@open402/db';

const EXCHANGE_RATE = 100;

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

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      type: 'credit_purchase',
      status: 'pending',
      amount: creditsAmount,
      currency: 'credits',
      description: `Compra de ${creditsAmount} créditos por $${amountMXN} MXN vía SPEI (Bitso)`,
      metadata: { amountMXN, exchangeRate: EXCHANGE_RATE },
    },
  });

  try {
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
      mxnAmount: amountMXN,
      exchangeRate: EXCHANGE_RATE,
      transactionId: transaction.id,
    });
  } catch (err) {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'failed', errorMessage: String(err), failedAt: new Date() },
    });

    return Response.json({ success: false, error: 'Error al procesar la compra' }, { status: 500 });
  }
}
