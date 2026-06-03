import type { Agent } from '@open402/db';

export function AgentList({ agents }: { agents: Agent[] }) {
  if (agents.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-2 font-semibold">Tus agentes</h3>
        <p className="text-sm text-gray-500">
          Aún no tienes agentes. Crea uno desde tu dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-semibold">Tus agentes</h3>
      <div className="space-y-2">
        {agents.map((agent) => (
          <div key={agent.id} className="flex items-center justify-between rounded bg-gray-50 px-3 py-2 text-sm">
            <div>
              <span className="font-medium">{agent.name}</span>
              <p className="text-xs text-gray-500">{agent.networkId}</p>
            </div>
            {agent.walletAddress && (
              <code className="rounded bg-gray-200 px-2 py-0.5 text-xs">
                {agent.walletAddress.slice(0, 6)}...{agent.walletAddress.slice(-4)}
              </code>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
