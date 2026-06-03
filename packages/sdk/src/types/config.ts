import type { SpendingRule } from './policies';

export type NetworkId =
  | 'arbitrum-mainnet'
  | 'arbitrum-sepolia'
  | 'base-mainnet'
  | 'base-sepolia';

export interface NetworkConfig {
  chain: 'arbitrum' | 'base';
  chainId: number;
  caip2: string;
  usdcAddress: `0x${string}`;
  facilitatorUrl: string;
  explorerUrl: string;
}

export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  'arbitrum-mainnet': {
    chain: 'arbitrum',
    chainId: 42161,
    caip2: 'eip155:42161',
    usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    facilitatorUrl: 'https://api.cdp.coinbase.com/platform/v2/x402',
    explorerUrl: 'https://arbiscan.io',
  },
  'arbitrum-sepolia': {
    chain: 'arbitrum',
    chainId: 421614,
    caip2: 'eip155:421614',
    usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    facilitatorUrl: 'https://api.cdp.coinbase.com/platform/v2/x402',
    explorerUrl: 'https://sepolia.arbiscan.io',
  },
  'base-mainnet': {
    chain: 'base',
    chainId: 8453,
    caip2: 'eip155:8453',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    facilitatorUrl: 'https://api.cdp.coinbase.com/platform/v2/x402',
    explorerUrl: 'https://basescan.org',
  },
  'base-sepolia': {
    chain: 'base',
    chainId: 84532,
    caip2: 'eip155:84532',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    facilitatorUrl: 'https://api.cdp.coinbase.com/platform/v2/x402',
    explorerUrl: 'https://sepolia.basescan.org',
  },
};

export const DEFAULT_NETWORK: NetworkId = 'arbitrum-mainnet';

export interface AgentXConfig {
  apiKey: string;
  apiUrl?: string;
  networkId?: NetworkId;
}

export interface WalletConfig {
  networkId: NetworkId;
  cdpApiKeyId?: string;
  cdpApiKeySecret?: string;
  walletSecret?: string;
}

export interface AgentConfig {
  name: string;
  wallet?: WalletConfig;
  policies?: SpendingRule[];
}
