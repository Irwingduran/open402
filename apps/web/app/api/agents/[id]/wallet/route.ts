import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  const agent = await prisma.agent.findFirst({
    where: { id, userId },
    include: { wallet: true },
  });

  if (!agent) {
    return Response.json({ error: 'Agente no encontrado' }, { status: 404 });
  }

  if (agent.wallet) {
    return Response.json({ address: agent.wallet.address }, { status: 200 });
  }

  const apiKeyName = process.env.CDP_API_KEY_NAME;
  const apiKeyPrivateKey = process.env.CDP_API_KEY_PRIVATE_KEY;

  if (!apiKeyName || !apiKeyPrivateKey) {
    return Response.json({ error: 'CDP API keys not configured' }, { status: 500 });
  }

  try {
    const { CdpWalletProvider } = await import('@coinbase/agentkit');
    const walletProvider = await CdpWalletProvider.configureWithWallet({
      apiKeyName,
      apiKeyPrivateKey: apiKeyPrivateKey.replace(/\\n/g, '\n'),
      networkId: agent.networkId,
    });

    const address = walletProvider.getAddress();

    const wallet = await prisma.wallet.create({
      data: {
        userId,
        agentId: id,
        address,
        networkId: agent.networkId,
        walletType: 'agentic',
      },
    });

    await prisma.agent.update({
      where: { id },
      data: { walletAddress: address },
    });

    return Response.json({ address: wallet.address }, { status: 201 });
  } catch (err) {
    return Response.json({
      error: 'Error al crear wallet del agente',
      details: String(err),
    }, { status: 500 });
  }
}
