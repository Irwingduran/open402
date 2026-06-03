import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@open402/db';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { telegramId } = await req.json();
  if (!telegramId) {
    return Response.json({ error: 'telegramId requerido' }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { telegramId },
  });

  if (existingUser && existingUser.id !== userId) {
    return Response.json({
      error: 'Esta cuenta de Telegram ya está vinculada a otro usuario',
    }, { status: 409 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { telegramId },
  });

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { telegramId },
  });

  return Response.json({ success: true });
}
