# open402

Infraestructura financiera para la economía de agentes. Una línea de código y tu agente paga APIs vía x402, servicios mexicanos (CFE, Telmex, Telcel) y lo que se le ocurra — sin wallets, sin llaves privadas, sin fricción.

## Stack

| Capa | Tecnología |
|------|-----------|
| Web | Next.js 14, Tailwind CSS, Clerk |
| Bot | Telegram (grammy), OpenAI GPT-4o / GPT-4o-mini |
| DB | PostgreSQL + Prisma |
| Auth | Clerk |
| Wallets | Coinbase CDP (AgentKit) |
| On-chain | Arbitrum (USDC x402) |
| FX | Bitso (MXN → USDC) |
| Pagos MX | Prontipagos (CFE, Telmex, Telcel, Izzi) |
| Monorepo | pnpm workspaces |

## Estructura

```
apps/
  web/       — Dashboard web (Next.js 14)
  bot/       — Bot de Telegram con IA
packages/
  db/        — Prisma schema + cliente
  agent/     — Agente autónomo con AgentKit
  agentkit/  — Action providers custom
  sdk/       — SDK público (@open402/agents)
  api/       — Lógica compartida de API
```

## Requisitos

- Node.js 20+
- pnpm 10+
- PostgreSQL 15 (local) o Supabase (producción)
- Clerk account (para auth)
- OpenAI API key (para el bot)
- Telegram Bot Token (de BotFather)

## Desarrollo local

```bash
# Variables de entorno
cp apps/web/.env.local.example apps/web/.env.local
cp apps/bot/.env.example apps/bot/.env
cp packages/db/.env.example packages/db/.env

# Inicializar DB
pnpm db:push
pnpm db:generate

# Iniciar todo
pnpm dev:all

# O por separado:
pnpm dev:web   # http://localhost:3000
pnpm dev:bot   # Telegram polling
```

## Bot de Telegram

El bot usa OpenAI GPT-4o Mini para entender lenguaje natural y GPT-4o Vision para leer recibos desde fotos. Comandos disponibles:

- **Enviar foto de recibo** — extrae servicio, referencia y monto, confirma y paga
- *"Crea un agente"* — crea agente con wallet
- *"Crea una regla para CFE de $500"* — configura regla de gasto
- *"Paga CFE ref 123456 por $350"* — ejecuta pago
- Consultar saldo, agentes, transacciones

## Licencia

Privado — open402
