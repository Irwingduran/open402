import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@open402/db';
import { Navbar } from '../../components/navbar';
import { CreditBalanceCard } from '../../components/credit-balance-card';
import { RecentTransactions } from '../../components/recent-transactions';
import { AgentList } from '../../components/agent-list';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/');

  let user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      agents: true,
      transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });

  if (!user) {
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    const email = clerkUser.emailAddresses?.[0]?.emailAddress;

    user = await prisma.user.create({
      data: {
        id: userId,
        email: email ?? '',
        name: clerkUser.firstName ?? null,
      },
      include: {
        agents: true,
        transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
  }

  return (
    <div className="bg-white text-slate-800 font-sans min-h-screen overflow-x-hidden">
      <Navbar active="dashboard" />
      <main className="px-8 py-10 max-w-[1080px] mx-auto">
        <h2 className="text-3xl font-extrabold tracking-tight italic mb-10">Dashboard</h2>
        <div className="space-y-8">
          <CreditBalanceCard credits={user.credits} />
          <AgentList initialAgents={user.agents} />
          <RecentTransactions transactions={user.transactions} />
        </div>
      </main>
    </div>
  );
}
