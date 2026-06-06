import { auth } from '@clerk/nextjs/server';
import { getOrderStatus, simulateFiatReceived, isEtherfuseConfigured } from '@/lib/etherfuse';

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return Response.json({ error: 'orderId requerido' }, { status: 400 });
  }

  try {
    const order = await getOrderStatus(orderId);

    return Response.json({
      orderId: order.orderId,
      status: order.status,
      depositClabe: order.depositClabe,
      depositBankName: order.depositBankName,
      depositAccountHolder: order.depositAccountHolder,
      amountInFiat: order.amountInFiat,
      amountInTokens: order.amountInTokens,
      confirmedTxSignature: order.confirmedTxSignature,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
      statusPage: order.statusPage,
    });
  } catch {
    return Response.json({ status: 'pending' });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { orderId } = await req.json();
  if (!orderId) {
    return Response.json({ error: 'orderId requerido' }, { status: 400 });
  }

  try {
    const result = await simulateFiatReceived(orderId);
    return Response.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
