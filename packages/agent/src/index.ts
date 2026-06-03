import { AgentKit, CdpWalletProvider, walletActionProvider, erc20ActionProvider } from '@coinbase/agentkit';
import { getLangChainTools } from '@coinbase/agentkit-langchain';
import { AgentXActionProvider } from '@open402/agentkit';
import { AgentX, type Agent as SDKAgent } from '@open402/agents';

export interface AgentConfig {
  cdpApiKeyName?: string;
  cdpApiKeyPrivateKey?: string;
  networkId?: string;
  open402ApiKey?: string;
}

export class AgentRuntime {
  private config: AgentConfig;
  private walletProvider?: CdpWalletProvider;
  private agentKit?: AgentKit;
  private sdkAgent?: SDKAgent;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  async initialize(sdkAgent?: SDKAgent): Promise<void> {
    this.walletProvider = await CdpWalletProvider.configureWithWallet({
      apiKeyName: this.config.cdpApiKeyName,
      apiKeyPrivateKey: this.config.cdpApiKeyPrivateKey,
      networkId: this.config.networkId ?? 'arbitrum-mainnet',
    });

    const actionProviders: unknown[] = [
      walletActionProvider(),
      erc20ActionProvider(),
    ];

    if (sdkAgent && this.config.open402ApiKey) {
      const open402 = await AgentX.create({
        apiKey: this.config.open402ApiKey,
      });
      actionProviders.push(new AgentXActionProvider(open402, sdkAgent));
    }

    this.agentKit = await AgentKit.from({
      walletProvider: this.walletProvider,
      actionProviders: actionProviders as never,
    });

    this.sdkAgent = sdkAgent;
  }

  async getLangChainTools(): Promise<ReturnType<typeof getLangChainTools>> {
    if (!this.agentKit) throw new Error('AgentRuntime not initialized');
    return getLangChainTools(this.agentKit as never);
  }

  async getVercelAITools(): Promise<unknown> {
    if (!this.agentKit) throw new Error('AgentRuntime not initialized');
    const { getVercelAITools } = await import('@coinbase/agentkit-vercel-ai-sdk');
    return getVercelAITools(this.agentKit);
  }

  getWalletAddress(): string | undefined {
    return this.walletProvider?.getAddress();
  }

  getNetworkId(): string {
    return this.config.networkId ?? 'arbitrum-mainnet';
  }
}
