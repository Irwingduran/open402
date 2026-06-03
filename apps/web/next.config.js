/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@open402/agents', '@open402/db'],
  serverExternalPackages: [
    '@coinbase/agentkit',
    '@privy-io/server-auth',
    '@hpke/chacha20poly1305',
  ],
};

export default nextConfig;
