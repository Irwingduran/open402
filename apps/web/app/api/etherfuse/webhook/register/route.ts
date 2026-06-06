import { createWebhook, isEtherfuseConfigured } from '@/lib/etherfuse';

const WEBAPP_URL = process.env.WEBAPP_URL ?? 'http://localhost:3000';

export async function POST() {
  if (!isEtherfuseConfigured()) {
    return Response.json({ error: 'Etherfuse no configurado — sin API key' }, { status: 400 });
  }

  const webhookId = crypto.randomUUID();
  const url = `${WEBAPP_URL}/api/etherfuse/webhook`;

  try {
    const result = await createWebhook({
      id: webhookId,
      eventType: 'order_updated',
      url,
    });

    return Response.json({
      success: true,
      webhook: result,
      hint: 'Guarda el secret — solo se muestra una vez.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
