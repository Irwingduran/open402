# open402

Infraestructura financiera para la economía de agentes autónomos.

open402 permite que agentes AI ejecuten pagos de forma autónoma — servicios mexicanos (CFE, Telmex, Telcel), APIs vía protocolo x402 en Arbitrum, y cualquier integración futura (sin que el usuario toque una wallet, una llave privada o un exchange).

---

## Arquitectura

```
Usuario ──► Dashboard Web (Next.js) ──► API ──► PostgreSQL
    │                                             │
    └──► Telegram Bot (GPT-4o) ─────────────────► Prisma
                        │
                        ├──► GPT-4o Vision (OCR de recibos)
                        └──► execute_payment tool
```

### Flujo de pago

1. **Créditos** — El usuario compra créditos (1 crédito ≈ $0.01 MXM). Paga en MXN vía SPEI.
2. **Bitso / MXNB** — El backend convierte MXN → MXNB (stablecoin mexicana en Arbitrum). Este paso es asíncrono.
3. **Reglas de gasto** — El usuario define reglas: servicio, monto máximo, confirmación obligatoria.
4. **Ejecución** — El agente (o el bot) ejecuta un pago. Se validan reglas, se deducen créditos, se crea una transacción.
5. **Liquidación** — Según el canal: x402 paga MXM en Arbitrum; Prontipagos paga servicios MX via API.

### Canales de pago

| Canal | Qué paga | Cómo |
|-------|----------|------|
| **x402** | APIs (OpenAI, CoinGecko, Perplexity…) | HTTP 402 → pago MXM desde Agentic Wallet del agente en Arbitrum |
| **Prontipagos** | CFE, Telmex, Telcel, Izzi (400+ servicios MX) | API REST con créditos internos |
| **Etherfuse** | Tokenización — Inversión en CETES | Compra de stablebonds respaldados por CETES vía API REST |

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Web | Next.js 14 (App Router), Tailwind CSS |
| Auth | Clerk (email, Google, GitHub) |
| Bot | Telegram Bot API (grammy) + OpenAI GPT-4o-mini / GPT-4o Vision |
| Base de datos | PostgreSQL + Prisma ORM |
| Wallets on-chain | Coinbase CDP (AgentKit MPC) |
| Red | Arbitrum One / Arbitrum Sepolia |
| Stablecoin | MXM (x402), MXNB (Bitso) |
| FX on-ramp | Bitso FXaaS — SPEI → MXN → MXNB/MXM |
| Tokenized Assets | Etherfuse — CETES stablebonds on Solana |
| Monorepo | pnpm workspaces |

---

## Estructura del proyecto

```
open402/
├── apps/
│   ├── web/               # Dashboard web (Next.js 14)
│   │   ├── app/           # App Router pages
│   │   │   ├── dashboard/ # Panel principal
│   │   │   ├── agents/    # Detalle de agente + ejecución
│   │   │   ├── credits/   # Compra de créditos
│   │   │   ├── rules/     # Reglas de gasto
│   │   │   ├── transactions/ # Historial
│   │   │   └── api/       # Rutas API (REST)
│   │   │       └── etherfuse/ # Etherfuse/CETES investment API
│   │   └── components/    # Componentes React
│   │
│   └── bot/               # Bot de Telegram
│       └── src/index.ts   # Bot con GPT-4o + tools
│
├── packages/
│   ├── db/                # Prisma schema + cliente
│   │   └── prisma/schema.prisma
│   ├── agent/             # Agente autónomo con AgentKit
│   ├── agentkit/          # Action providers custom (pagos MX)
│   ├── sdk/               # SDK público (@open402/agents)
│   └── api/               # Lógica compartida de API
│
├── pnpm-workspace.yaml
└── package.json
```

---

## Modelo de créditos

Los créditos son la capa de abstracción entre el usuario y la blockchain.

```
Usuario —► MXN (SPEI) —► Bitso —► MXNB/MXM (Arbitrum)
                                              │
                                    Créditos internos (1:1 con MXM)
                                              │
Agente ejecuta —► deduce créditos —► tx record —► on-chain settlement
```

- 1 crédito = $0.01 MXM
- 100 créditos = $1 MXN
- No se requiere wallet del usuario
- El backend maneja la conversión MXN → MXM/MXNB de forma asíncrona

---

## Bot de Telegram

El bot es la interfaz conversacional del agente. Usa GPT-4o-mini para entender intención y GPT-4o Vision para OCR de recibos.

### Capacidades

- **Foto de recibo** — envía la foto de un recibo (CFE, Telmex, Telcel, Izzi). GPT-4o Vision extrae servicio, referencia y monto. Confirma contigo y paga.
- **Crear agente** — *"crea un agente"* → lo crea con wallet mock en Arbitrum Sepolia
- **Reglas de gasto** — *"crea una regla para CFE de $500"* → configura límite
- **Ejecutar pagos** — *"paga CFE ref 123456 por $350"* → valida reglas, deduce créditos, registra transacción
- **Consultas** — saldo, agentes, detalle de agente, historial de transacciones

### Tools (function calling)

El modelo decide cuándo llamar cada tool:

| Tool | Descripción |
|------|-------------|
| `get_balance` | Saldo de créditos |
| `list_agents` | Agentes del usuario |
| `get_agent_detail` | Reglas, wallet, últimas tx de un agente |
| `create_agent` | Crear agente + wallet mock |
| `create_rule` | Crear regla de gasto |
| `get_transactions` | Últimas transacciones |
| `execute_payment` | Validar reglas, deducir créditos, ejecutar pago |
| `invest_in_cetes` | Invertir en CETES — genera orden en Etherfuse y devuelve CLABE para depositar |
| `check_investment` | Consultar estado de una inversión por orderId |

---

## On-chain: Arbitrum + x402 + Coinbase CDP

Las Agentic Wallets se crean con Coinbase Developer Platform (MPC). El flujo x402:

1. El agente hace una request HTTP a una API
2. La API responde con HTTP 402 (Payment Required)
3. El agente firma una transferencia MXM desde su Agentic Wallet
4. La transacción se envía a Arbitrum
5. El agente reintenta la request con el proof de pago

Actualmente en modo mock (sin CDP keys configuradas). Las wallets se crean con direcciones determinísticas basadas en sha256.

---

## Bitso FXaaS + MXNB

El on-ramp fiat funciona vía Bitso:

1. Usuario genera orden de compra en el dashboard
2. Recibe instrucciones SPEI (CLABE + referencia)
3. Transfiere MXN
4. Bitso convierte MXN → MXNB (stablecoin mexicana)
5. MXNB se deposita en la pool wallet de open402 en Arbitrum
6. Los créditos se acreditan al usuario

---

## Etherfuse — Inversión en CETES

open402 integra **Etherfuse** para permitir la compra de stablebonds respaldados por CETES (Certificados de la Tesorería de México). Esto permite que los usuarios automaticen su inversión en el activo libre de riesgo mexicano directamente desde el bot o futura UI web.

### Flujo de inversión

1. Usuario solicita invertir una cantidad en CETES (ej. `invertir $500 en CETES`)
2. El bot genera una cotización vía Etherfuse API (monto, tasa nominal, fees)
3. El usuario confirma y se crea una orden, devolviendo un CLABE para depositar
4. El usuario transfiere los MXN al CLABE vía SPEI
5. Etherfuse recibe el depósito, ejecuta la compra del stablebond
6. Un webhook actualiza el estado de la inversión en DB (`completed` + `cetesReceived`)
7. El usuario puede consultar el estado con `check_investment`

### APIs expuestas

| Endpoint | Descripción |
|----------|-------------|
| `POST /api/etherfuse/purchase` | Crear cotización + orden de compra |
| `GET /api/etherfuse/status` | Consultar estado de una orden |
| `POST /api/etherfuse/webhook` | Webhook para recibir actualizaciones de orden |
| `POST /api/etherfuse/webhook/register` | Registrar webhook con Etherfuse |

### Arquitectura

```
Usuario ──► Bot / API ──► Etherfuse (sandbox)
    │                           │
    │                    Cotización → Orden → CLABE
    │                           │
    └── SPEI ──► Depósito ──►  │
                               │
                    Webhook ◄──┘
                         │
                    Actualiza DB (Investment)
```

### Entorno

| Variable | Propósito |
|----------|-----------|
| `ETHERFUSE_API_KEY` | API key de sandbox o producción |
| `ETHERFUSE_API_URL` | URL base (default: `https://api.sand.etherfuse.com`) |
| `ETHERFUSE_WEBHOOK_SECRET` | Secreto HMAC para verificar webhooks |

---

## Desarrollo local

### Requisitos

- Node.js 20+
- pnpm 10+
- PostgreSQL 15 (via Homebrew)
- Clerk account (gratuita)
- OpenAI API key
- Telegram Bot Token (de [BotFather](https://t.me/BotFather))

### Setup

```bash
# Clonar e instalar
git clone https://github.com/Irwingduran/open402.git
cd open402
pnpm install

# Base de datos
createdb open402
pnpm db:push
pnpm db:generate

# Variables de entorno
cp apps/web/.env.local.example apps/web/.env.local
cp apps/bot/.env.example apps/bot/.env
cp packages/db/.env.example packages/db/.env

# Editar .env.local con tus keys:
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# - CLERK_SECRET_KEY
# - ETHERFUSE_API_KEY (para inversión en CETES)
# - TELEGRAM_BOT_TOKEN (opcional, solo para webhook linking)

# Editar apps/bot/.env con:
# - TELEGRAM_BOT_TOKEN
# - OPENAI_API_KEY
# - ETHERFUSE_API_KEY
# - DATABASE_URL
# - WEBAPP_URL

# Iniciar
pnpm dev:all
# o por separado:
pnpm dev:web   # → http://localhost:3000
pnpm dev:bot   # → Telegram polling
```

### Comandos útiles

```bash
pnpm dev:web         # Dashboard
pnpm dev:bot         # Bot de Telegram (polling)
pnpm dev:all         # Ambos
pnpm db:push         # Sincronizar schema a DB
pnpm db:studio       # Prisma Studio (UI de DB)
pnpm typecheck       # TypeScript check en todos los paquetes
```

---

## Licencia

Privado — open402
