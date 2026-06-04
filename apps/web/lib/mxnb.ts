import { createPublicClient, http, type Address } from 'viem';
import { arbitrum, arbitrumSepolia } from 'viem/chains';

const MXNB_PROXY_ARBITRUM_ONE: Address = '0xF197FFC28c23E0309B5559e7a166f2c6164C80aA';
const MXNB_PROXY_SEPOLIA: Address = '0x82B9e52b26A2954E113F94Ff26647754d5a4247D';

const MXNB_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: 'success', type: 'bool' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: 'success', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: 'remaining', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
] as const;

const MXNB_DECIMALS = 6;

type NetworkId = 'arbitrum-mainnet' | 'arbitrum-sepolia';

function getChain(networkId: NetworkId) {
  return networkId === 'arbitrum-sepolia' ? arbitrumSepolia : arbitrum;
}

function getProxyAddress(networkId: NetworkId): Address {
  return networkId === 'arbitrum-sepolia' ? MXNB_PROXY_SEPOLIA : MXNB_PROXY_ARBITRUM_ONE;
}

function getRpcUrl(networkId: NetworkId): string {
  const url =
    networkId === 'arbitrum-sepolia'
      ? process.env.ARBITRUM_SEPOLIA_RPC_URL
      : process.env.ARBITRUM_RPC_URL;

  if (url) return url;

  const chainId = networkId === 'arbitrum-sepolia' ? '421614' : '42161';
  const infuraKey = process.env.INFURA_API_KEY;
  if (infuraKey) return `https://arbitrum-mainnet.infura.io/v3/${infuraKey}`;

  return `https://${chainId}.arbitrum.rpc.thirdweb.com`;
}

export function createMxnbPublicClient(networkId: NetworkId) {
  return createPublicClient({
    chain: getChain(networkId),
    transport: http(getRpcUrl(networkId)),
  });
}

export async function getMxnbBalance(
  walletAddress: Address,
  networkId: NetworkId = 'arbitrum-mainnet',
): Promise<number> {
  const client = createMxnbPublicClient(networkId);
  const balance = await client.readContract({
    address: getProxyAddress(networkId),
    abi: MXNB_ABI,
    functionName: 'balanceOf',
    args: [walletAddress],
  });
  return Number(balance) / 10 ** MXNB_DECIMALS;
}

export async function getMxnbDecimals(
  networkId: NetworkId = 'arbitrum-mainnet',
): Promise<number> {
  const client = createMxnbPublicClient(networkId);
  const decimals = await client.readContract({
    address: getProxyAddress(networkId),
    abi: MXNB_ABI,
    functionName: 'decimals',
  });
  return Number(decimals);
}

export function mxnbToUnits(amount: number): bigint {
  return BigInt(Math.round(amount * 10 ** MXNB_DECIMALS));
}

export function unitsToMxnb(units: bigint): number {
  return Number(units) / 10 ** MXNB_DECIMALS;
}

export { MXNB_PROXY_ARBITRUM_ONE, MXNB_PROXY_SEPOLIA, MXNB_DECIMALS };
export type { NetworkId };
