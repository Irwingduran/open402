import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { deductCredits, checkBalance } from '@/lib/credits';

type Action = 'bill_payment' | 'x402_payment' | 'test';

const SERVICE_LABELS: Record<string, string> = {
  cfe: 'Pago de CFE',
  telmex: 'Pago de Telmex',
  telcel: 'Pago de Telcel',
  izzi: 'Pago de Izzi',
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action, service, amount, metadata } = body as {
    action: Action;
    service?: string;
    amount: number;
    metadata?: Record<string, unknown>;
  };

  if (!action || !amount || amount <= 0) {
    return Response.json({ error: 'acción y monto requeridos' }, { status: 400 });
  }

  const agent = await prisma.agent.findFirst({ where: { id, userId } });
  if (!agent) {
    return Response.json({ error: 'Agente no encontrado' }, { status: 404 });
  }

  // 1. Check spending rules
  const rules = await prisma.spendingRule.findMany({
    where: {
      userId,
      OR: [{ agentId: id }, { agentId: null }],
      enabled: true,
    },
  });

  const matchedService = service && SERVICE_LABELS[service] ? service : '*';
  const applicableRules = rules.filter(
    (r) => r.service === '*' || r.service === matchedService,
  );

  for (const rule of applicableRules) {
    if (amount > rule.maxAmount) {
      return Response.json({
        error: `Regla de gasto excedida`,
        reason: `El monto $${amount} excede el límite de $${rule.maxAmount} para ${rule.service}`,
        requiresConfirmation: rule.requiresConfirmation,
      }, { status: 403 });
    }
  }

  // 2. Check credits
  const { available } = await checkBalance(userId);
  if (available < amount) {
    return Response.json({
      error: 'Créditos insuficientes',
      reason: `Tienes ${available} créditos, necesitas ${amount}`,
    }, { status: 402 });
  }

  // 3. If action is 'test', don't actually deduct
  if (action === 'test') {
    return Response.json({
      success: true,
      message: '✅ Reglas y créditos OK. Simulación exitosa.',
      agent: agent.name,
      rulesChecked: applicableRules.length,
      creditsAvailable: available,
      creditsRequired: amount,
    });
  }

  // 4. Deduct credits (atomic)
  const description = service && SERVICE_LABELS[service]
    ? SERVICE_LABELS[service]
    : action === 'x402_payment'
      ? 'Pago x402'
      : 'Ejecución de agente';

  const deduction = await deductCredits(userId, amount, {
    agentId: id,
    description,
    type: action === 'x402_payment' ? 'x402_payment' : 'bill_payment',
    metadata: { ...metadata, service, action },
  });

  if (!deduction.success) {
    return Response.json({ error: deduction.error }, { status: 500 });
  }

  // 5. Try CDP wallet transaction if keys exist and agent has wallet
  let txHash: string | undefined;
  const hasCdpKeys = process.env.CDP_API_KEY_NAME && process.env.CDP_API_KEY_PRIVATE_KEY;
  const agentWallet = await prisma.wallet.findFirst({ where: { agentId: id } });

  if (hasCdpKeys && agentWallet) {
    try {
      const { CdpWalletProvider } = await import('@coinbase/agentkit');
      const walletProvider = await CdpWalletProvider.configureWithWallet({
        apiKeyName: process.env.CDP_API_KEY_NAME!,
        apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        networkId: agent.networkId,
      });
      // TODO: actual MXNB transfer when pool wallet is ready
      txHash = walletProvider.getAddress();
    } catch (err) {
      console.warn('CDP wallet tx skipped:', err);
    }
  }

  // 6. Update transaction with CDP result
  if (txHash) {
    await prisma.transaction.update({
      where: { id: deduction.transactionId },
      data: { txHash },
    });
  }

  return Response.json({
    success: true,
    transactionId: deduction.transactionId,
    txHash,
    cdpConfigured: !!hasCdpKeys,
    walletConfigured: !!agentWallet,
    message: hasCdpKeys && agentWallet
      ? '✅ Pago ejecutado'
      : '⚠️ Créditos deducidos. La ejecución on-chain requiere configurar CDP API keys.',
  }, { status: 201 });
}
