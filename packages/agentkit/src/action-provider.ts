import { type z } from 'zod';
import {
  ActionProvider,
  WalletProvider,
  Network,
  CreateAction,
} from '@coinbase/agentkit';
import { AgentX, Agent } from '@open402/agents';
import {
  PayBillSchema,
  PayX402Schema,
  GetBalanceSchema,
  GetHistorySchema,
  AddRuleSchema,
  RemoveRuleSchema,
  InvestCETESSchema,
  CheckInvestmentSchema,
} from './schemas';

export class AgentXActionProvider extends ActionProvider<WalletProvider> {
  private sdk: AgentX;
  private agent: Agent;

  constructor(sdk: AgentX, agent: Agent) {
    super('open402', []);
    this.sdk = sdk;
    this.agent = agent;
  }

  @CreateAction({
    name: 'open402_pay_bill',
    description: 'Pay a Mexican service bill such as CFE (electricity), Telmex (internet), Telcel (phone), or Izzi (cable/internet). Requires service name, account reference number, and amount to pay.',
    schema: PayBillSchema,
  })
  async payBill(
    _walletProvider: WalletProvider,
    args: z.infer<typeof PayBillSchema>
  ): Promise<string> {
    try {
      const result = await this.agent.payBill({
        service: args.service,
        reference: args.reference,
        amount: args.amount,
      });

      if (result.success) {
        return `Successfully paid ${args.service.toUpperCase()} bill for $${args.amount} MXN. Confirmation code: ${result.confirmationCode ?? 'N/A'}. Transaction ID: ${result.transactionId}.`;
      }

      return `Failed to pay ${args.service.toUpperCase()} bill.`;
    } catch (error) {
      return `Error paying bill: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  @CreateAction({
    name: 'open402_pay_x402',
    description: 'Pay an external API endpoint using the x402 protocol. Use this when an API returns HTTP 402 Payment Required. Provide the URL, HTTP method, and optional headers/body.',
    schema: PayX402Schema,
  })
  async payX402(
    _walletProvider: WalletProvider,
    args: z.infer<typeof PayX402Schema>
  ): Promise<string> {
    try {
      const result = await this.agent.payX402({
        url: args.url,
        method: args.method,
        headers: args.headers,
        body: args.body,
      });

      if (result.success) {
        return `Successfully paid via x402 for ${args.url}. Cost: ${result.cost} credits. Transaction ID: ${result.transactionId}.`;
      }

      return `Failed to pay via x402 for ${args.url} after retries.`;
    } catch (error) {
      return `Error during x402 payment: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  @CreateAction({
    name: 'open402_get_balance',
    description: 'Get the current credit balance available for the agent. Returns the number of credits remaining for payments.',
    schema: GetBalanceSchema,
  })
  async getBalance(
    _walletProvider: WalletProvider
  ): Promise<string> {
    try {
      const balance = await this.agent.getBalance();
      return `Current credit balance: ${balance} credits.`;
    } catch (error) {
      return `Error fetching balance: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  @CreateAction({
    name: 'open402_get_history',
    description: 'Get the recent transaction history for this agent. Returns the last N transactions with details.',
    schema: GetHistorySchema,
  })
  async getHistory(
    _walletProvider: WalletProvider,
    args: z.infer<typeof GetHistorySchema>
  ): Promise<string> {
    try {
      const transactions = await this.agent.getHistory(args.limit);
      if (transactions.length === 0) {
        return 'No transactions found.';
      }

      return transactions
        .map(
          (tx) =>
            `[${tx.type}] ${tx.amount} ${tx.currency} — ${tx.status} — ${tx.description} (${tx.createdAt})`
        )
        .join('\n');
    } catch (error) {
      return `Error fetching history: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  @CreateAction({
    name: 'open402_add_rule',
    description: 'Add a spending rule for the agent. Define service, max amount, and whether user confirmation is required for amounts above a threshold.',
    schema: AddRuleSchema,
  })
  async addRule(
    _walletProvider: WalletProvider,
    args: z.infer<typeof AddRuleSchema>
  ): Promise<string> {
    try {
      const rule = this.agent.addRule({
        service: args.service,
        maxAmount: args.maxAmount,
        requiresConfirmation: args.requiresConfirmation,
        confirmationThreshold: args.confirmationThreshold,
      });

      return `Added rule for "${rule.service}": max ${rule.maxAmount}, confirmation required: ${rule.requiresConfirmation}. Rule ID: ${rule.id}.`;
    } catch (error) {
      return `Error adding rule: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  @CreateAction({
    name: 'open402_remove_rule',
    description: 'Remove an existing spending rule by its ID.',
    schema: RemoveRuleSchema,
  })
  async removeRule(
    _walletProvider: WalletProvider,
    args: z.infer<typeof RemoveRuleSchema>
  ): Promise<string> {
    const removed = this.agent.removeRule(args.ruleId);
    if (removed) {
      return `Removed rule ${args.ruleId}.`;
    }
    return `Rule ${args.ruleId} not found.`;
  }

  @CreateAction({
    name: 'open402_invest_cetes',
    description: 'Invest in CETES (Mexican government treasury bonds) via Etherfuse. Creates a purchase order and returns SPEI deposit instructions. Amount should be between 100 and 50,000 MXN.',
    schema: InvestCETESSchema,
  })
  async investCETES(
    _walletProvider: WalletProvider,
    args: z.infer<typeof InvestCETESSchema>
  ): Promise<string> {
    try {
      const result = await this.agent.investInCETES({ amountMXN: args.amountMXN });

      if (result.success && result.depositClabe) {
        return [
          `Investment order created for $${args.amountMXN} MXN in CETES.`,
          `Deposit via SPEI to CLABE: ${result.depositClabe}`,
          `Bank: ${result.depositBankName}`,
          `Account holder: ${result.depositAccountHolder}`,
          `Amount: $${result.depositAmount} MXN`,
          `Order ID: ${result.orderId}`,
          result.mock ? '\n(Using mock mode — no real Etherfuse API key configured)' : '',
        ].filter(Boolean).join('\n');
      }

      return `Failed to create investment order. Please try again.`;
    } catch (error) {
      return `Error investing in CETES: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  @CreateAction({
    name: 'open402_check_investment',
    description: 'Check the status of a CETES investment order by its order ID. Returns current status, deposit info, and token details.',
    schema: CheckInvestmentSchema,
  })
  async checkInvestment(
    _walletProvider: WalletProvider,
    args: z.infer<typeof CheckInvestmentSchema>
  ): Promise<string> {
    try {
      const result = await this.agent.checkInvestment(args.orderId);

      return [
        `Investment order: ${result.orderId}`,
        `Status: ${result.status}`,
        result.depositClabe ? `Deposit CLABE: ${result.depositClabe}` : '',
        result.amountInTokens ? `CETES received: ${result.amountInTokens}` : '',
        result.amountInFiat ? `Amount: $${result.amountInFiat} MXN` : '',
        result.completedAt ? `Completed at: ${result.completedAt}` : '',
        result.statusPage ? `Status page: ${result.statusPage}` : '',
      ].filter(Boolean).join('\n');
    } catch (error) {
      return `Error checking investment: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  supportsNetwork = (network: Network) =>
    network.protocolFamily === 'evm' || network.protocolFamily === 'solana';
}
