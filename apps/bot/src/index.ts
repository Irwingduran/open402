import { Bot, InlineKeyboard, webhookCallback } from 'grammy';
import { prisma } from '@open402/db';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is required');

const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
const isDev = process.env.NODE_ENV === 'development';

const bot = new Bot(token);

bot.api.setMyCommands([
  { command: 'start', description: 'Iniciar el bot' },
  { command: 'saldo', description: 'Consultar saldo de créditos' },
  { command: 'agentes', description: 'Listar tus agentes' },
  { command: 'historial', description: 'Últimas transacciones' },
  { command: 'ayuda', description: 'Comandos disponibles' },
]);

bot.command('start', async (ctx) => {
  const telegramId = String(ctx.from.id);
  const name = ctx.from.first_name;

  const existing = await prisma.user.findUnique({ where: { telegramId } });
  if (existing) {
    await ctx.reply(
      `Bienvenido de nuevo, ${name}!\n\nTienes ${existing.credits} créditos disponibles.\n\nUsa /saldo para ver tu saldo.\nUsa /ayuda para ver los comandos.`
    );
    return;
  }

  const keyboard = new InlineKeyboard().url(
    'Vincular cuenta',
    `${process.env.WEBAPP_URL ?? 'http://localhost:3000'}/?telegram_id=${telegramId}`
  );

  await ctx.reply(
    `Hola ${name}! 👋\n\nSoy el asistente de open402.\n\nPara empezar, vincula tu cuenta de Telegram en el dashboard web:`,
    { reply_markup: keyboard }
  );
});

bot.command('saldo', async (ctx) => {
  const telegramId = String(ctx.from.id);
  const user = await prisma.user.findUnique({ where: { telegramId } });

  if (!user) {
    await ctx.reply('Aún no tienes una cuenta. Usa /start para empezar.');
    return;
  }

  await ctx.reply(
    `💰 Tu saldo: *${user.credits.toLocaleString()} créditos*`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('agentes', async (ctx) => {
  const telegramId = String(ctx.from.id);
  const user = await prisma.user.findUnique({
    where: { telegramId },
    include: { agents: true },
  });

  if (!user || user.agents.length === 0) {
    await ctx.reply('No tienes agentes. Crea uno desde el dashboard web.');
    return;
  }

  const lines = user.agents.map(
    (a) => `• ${a.name}${a.walletAddress ? ` (${a.walletAddress.slice(0, 6)}...)` : ''}`
  );
  await ctx.reply(`Tus agentes:\n${lines.join('\n')}`);
});

bot.command('historial', async (ctx) => {
  const telegramId = String(ctx.from.id);
  const user = await prisma.user.findUnique({
    where: { telegramId },
    include: {
      transactions: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  if (!user || user.transactions.length === 0) {
    await ctx.reply('Aún no hay transacciones.');
    return;
  }

  const lines = user.transactions.map(
    (tx) => `• ${tx.type.replace('_', ' ')}: ${tx.amount} ${tx.currency} — ${tx.status}`
  );
  await ctx.reply(`Últimas transacciones:\n${lines.join('\n')}`);
});

bot.command('ayuda', async (ctx) => {
  await ctx.reply(
    'Comandos disponibles:\n\n' +
    '/start - Iniciar el bot\n' +
    '/saldo - Consultar saldo\n' +
    '/agentes - Listar agentes\n' +
    '/historial - Últimas transacciones\n' +
    '/ayuda - Este mensaje'
  );
});

bot.on('message', async (ctx) => {
  await ctx.reply('Usa /ayuda para ver los comandos disponibles.');
});

if (isDev || !webhookUrl) {
  bot.start({ drop_pending_updates: true });
  console.log('Bot running in polling mode...');
} else {
  const handler = webhookCallback(bot, 'std/http');
  Bun.serve({
    port: 8080,
    async fetch(req) {
      if (req.method === 'POST') {
        return handler(req);
      }
      return new Response('OK');
    },
  });
}

export default bot;
