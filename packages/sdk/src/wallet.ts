import { WalletConfig, NetworkConfig, NETWORKS, DEFAULT_NETWORK } from './types';

export interface WalletBalance {
  usdc: bigint;
  eth: bigint;
}

export class AgentWallet {
  readonly address: `0x${string}`;
  readonly network: NetworkConfig;

  private walletConfig: WalletConfig;

  constructor(address: `0x${string}`, config: WalletConfig) {
    this.address = address;
    this.walletConfig = config;
    this.network = NETWORKS[config.networkId] ?? NETWORKS[DEFAULT_NETWORK];
  }

  static async create(config: WalletConfig): Promise<AgentWallet> {
    const address = await this.createWalletOnCdp(config);
    return new AgentWallet(address, config);
  }

  static async import(config: WalletConfig, address: `0x${string}`): Promise<AgentWallet> {
    return new AgentWallet(address, config);
  }

  private static async createWalletOnCdp(_config: WalletConfig): Promise<`0x${string}`> {
    return '0x0000000000000000000000000000000000000000';
  }

  async getBalance(): Promise<WalletBalance> {
    return { usdc: 0n, eth: 0n };
  }

  async sendUSDC(to: `0x${string}`, amount: string): Promise<`0x${string}`> {
    return '0x';
  }

  toJSON(): Record<string, unknown> {
    return {
      address: this.address,
      networkId: this.walletConfig.networkId,
      network: this.network.chain,
    };
  }
}
