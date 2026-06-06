import { WalletConfig, NetworkConfig, NETWORKS, DEFAULT_NETWORK } from './types';
import { ApiClient } from './client/api-client';

export interface WalletBalance {
  mxm: bigint;
  eth: bigint;
}

function mockAddress(): `0x${string}` {
  const hex = Math.random().toString(16).slice(2, 42);
  return `0x${hex.padEnd(40, '0')}`;
}

function mockTxHash(): `0x${string}` {
  const hex = Math.random().toString(16).slice(2, 66);
  return `0x${hex.padEnd(64, '0')}`;
}

export class AgentWallet {
  readonly address: `0x${string}`;
  readonly network: NetworkConfig;

  private walletConfig: WalletConfig;
  private client?: ApiClient;

  constructor(address: `0x${string}`, config: WalletConfig, client?: ApiClient) {
    this.address = address;
    this.walletConfig = config;
    this.network = NETWORKS[config.networkId] ?? NETWORKS[DEFAULT_NETWORK];
    this.client = client;
  }

  static async create(config: WalletConfig, client?: ApiClient): Promise<AgentWallet> {
    let address: `0x${string}`;
    if (client) {
      try {
        const result = await client.createWallet(config.networkId);
        address = result.address;
      } catch {
        address = mockAddress();
      }
    } else {
      address = mockAddress();
    }
    return new AgentWallet(address, config, client);
  }

  static async import(config: WalletConfig, address: `0x${string}`, client?: ApiClient): Promise<AgentWallet> {
    return new AgentWallet(address, config, client);
  }

  async getBalance(): Promise<WalletBalance> {
    if (this.client) {
      try {
        const bal = await this.client.getWalletBalance(this.address);
        return { mxm: BigInt(bal.mxm), eth: BigInt(bal.eth) };
      } catch {
        return { mxm: 0n, eth: 0n };
      }
    }
    return { mxm: 0n, eth: 0n };
  }

  async sendMXM(to: `0x${string}`, amount: string): Promise<`0x${string}`> {
    if (this.client) {
      try {
        const result = await this.client.transferMXM(this.address, to, amount);
        return result.txHash;
      } catch {
        return mockTxHash();
      }
    }
    return mockTxHash();
  }

  toJSON(): Record<string, unknown> {
    return {
      address: this.address,
      networkId: this.walletConfig.networkId,
      network: this.network.chain,
    };
  }
}
